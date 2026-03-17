import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { createJoinError, JOIN_ERROR_CODES } from "./lib/joinErrors";
import type { PriorQuizAssignment } from "./lib/quizRoundSelection";
import {
  canSatisfyRoundForPlayers,
  expandComplexitiesForEasierQuestion,
} from "./lib/quizRoundSelection";
import {
  QUIZ_ANSWER_WINDOW_MS,
  validateRoundConfig,
} from "./lib/quizValidation";
import { ensureQuestionBankLoaded } from "./quizQuestionLoader";
import { getReadyQuestionsForRules } from "./quizQuestions";

type QuizAccessCtx = MutationCtx | QueryCtx;
type PlayerEntryId = Id<"playerEntries">;
type QuizQuestionId = Id<"quizQuestions">;

function getPlayerNextQuizAdvantage(player: Doc<"playerEntries">) {
  return player.nextQuizAdvantage ?? "none";
}

function getSessionBattleJoinStatus(session: Doc<"gameSessions">) {
  return session.battleJoinStatus ?? "pre_battle";
}

async function getJoinedPlayers(
  ctx: QuizAccessCtx,
  sessionId: Id<"gameSessions">,
  roundNumber: number,
): Promise<Doc<"playerEntries">[]> {
  const players = await ctx.db
    .query("playerEntries")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  return players.filter(
    (player) =>
      player.joinStatus === "joined" &&
      player.eligibleFromRoundNumber <= roundNumber,
  );
}

async function getPriorAssignments(
  ctx: QuizAccessCtx,
  sessionId: Id<"gameSessions">,
): Promise<PriorQuizAssignment<PlayerEntryId, QuizQuestionId>[]> {
  const rounds = await ctx.db
    .query("gameRounds")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  const roundIds = new Set(rounds.map((round) => round._id));
  const assignments = await ctx.db.query("quizAssignments").collect();

  return assignments
    .filter((assignment) => roundIds.has(assignment.roundId))
    .map((assignment) => ({
      playerEntryId: assignment.playerEntryId,
      quizQuestionId: assignment.quizQuestionId,
    }));
}

function isSkillDefinition(
  skill: Doc<"skillDefinitions"> | null,
): skill is Doc<"skillDefinitions"> {
  return skill !== null;
}

async function createBatchAssignments(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  round: Doc<"gameRounds">,
  batchNumber: number,
) {
  const players = await getJoinedPlayers(ctx, sessionId, round.roundNumber);
  if (players.length === 0) {
    return [];
  }

  const questions = await getReadyQuestionsForRules(
    ctx,
    round.allowedCategories,
    round.allowedComplexities,
  );
  const priorAssignments = await getPriorAssignments(ctx, sessionId);
  const now = Date.now();
  const assignmentIds = [];
  const reservedQuestionIds = new Set<string>();
  for (const player of players) {
    const allowedComplexities =
      getPlayerNextQuizAdvantage(player) === "easier_question"
        ? expandComplexitiesForEasierQuestion(round.allowedComplexities)
        : round.allowedComplexities;
    const seenQuestionIds = new Set(
      priorAssignments
        .filter((assignment) => assignment.playerEntryId === player._id)
        .map((assignment) => assignment.quizQuestionId.toString()),
    );
    const question = questions.find(
      (currentQuestion) =>
        currentQuestion.status === "ready" &&
        round.allowedCategories.includes(currentQuestion.category) &&
        allowedComplexities.includes(currentQuestion.complexity) &&
        !seenQuestionIds.has(currentQuestion._id.toString()) &&
        !reservedQuestionIds.has(currentQuestion._id.toString()),
    );

    if (!question) {
      createJoinError(
        JOIN_ERROR_CODES.insufficientQuestions,
        "The selected category and complexity rules do not have enough unique questions for this round.",
      );
    }

    reservedQuestionIds.add(question._id.toString());
    assignmentIds.push(
      await ctx.db.insert("quizAssignments", {
        sessionId,
        roundId: round._id,
        playerEntryId: player._id,
        quizQuestionId: question._id,
        batchNumber,
        status: "presented",
        assignedAt: now,
        expiresAt: now + QUIZ_ANSWER_WINDOW_MS,
        scoredAt: null,
        awardedTokens: 0,
      }),
    );

    if (getPlayerNextQuizAdvantage(player) === "easier_question") {
      await ctx.db.patch(player._id, {
        nextQuizAdvantage: "none",
      });
    }
  }

  return assignmentIds;
}

export async function advanceRoundIfNeeded(
  ctx: MutationCtx,
  roundId: Id<"gameRounds">,
) {
  const round = await ctx.db.get(roundId);
  if (!round || round.status !== "active") {
    return;
  }

  const currentBatchNumber = round.questionsCompleted + 1;
  const batchAssignments = (
    await ctx.db
      .query("quizAssignments")
      .withIndex("by_round_and_batch", (q) =>
        q.eq("roundId", roundId).eq("batchNumber", currentBatchNumber),
      )
      .collect()
  ).filter((assignment) => assignment.status === "presented");

  if (batchAssignments.length > 0) {
    return;
  }

  const now = Date.now();
  const nextCompleted = round.questionsCompleted + 1;
  const session = await ctx.db.get(round.sessionId);
  if (!session) {
    return;
  }

  if (nextCompleted >= round.questionTarget) {
    await ctx.db.patch(round._id, {
      status: "completed",
      questionsCompleted: nextCompleted,
      completedAt: now,
    });
    await ctx.db.patch(session._id, {
      activeRoundId: null,
      participationWindowStatus: "idle",
      updatedAt: now,
      status: "in_progress",
    });
    return;
  }

  await ctx.db.patch(round._id, {
    questionsCompleted: nextCompleted,
  });

  await createBatchAssignments(
    ctx,
    session._id,
    {
      ...round,
      questionsCompleted: nextCompleted,
    },
    nextCompleted + 1,
  );
}

export const startRound = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    questionTarget: v.number(),
    allowedCategories: v.array(v.string()),
    allowedComplexities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const validationError = validateRoundConfig(
      args.questionTarget,
      args.allowedCategories,
      args.allowedComplexities,
    );
    if (validationError) {
      createJoinError(JOIN_ERROR_CODES.invalidRoundConfig, validationError);
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    if (session.activeRoundId) {
      createJoinError(
        JOIN_ERROR_CODES.invalidRoundConfig,
        "A round is already active for this session.",
      );
    }

    await ensureQuestionBankLoaded(ctx);

    const roundNumber = session.currentRoundNumber + 1;
    const eligiblePlayers = await getJoinedPlayers(
      ctx,
      session._id,
      roundNumber,
    );
    const questions = await getReadyQuestionsForRules(
      ctx,
      args.allowedCategories,
      args.allowedComplexities,
    );
    const priorAssignments = await getPriorAssignments(ctx, session._id);

    if (
      !canSatisfyRoundForPlayers(
        eligiblePlayers,
        questions,
        priorAssignments,
        args.questionTarget,
      )
    ) {
      createJoinError(
        JOIN_ERROR_CODES.insufficientQuestions,
        "Not enough unique questions are available for every eligible player in this round.",
      );
    }

    const now = Date.now();
    const roundId = await ctx.db.insert("gameRounds", {
      sessionId: session._id,
      roundNumber,
      status: "active",
      questionTarget: args.questionTarget,
      questionsCompleted: 0,
      allowedCategories: args.allowedCategories,
      allowedComplexities: args.allowedComplexities,
      createdByHostAt: now,
      startedAt: now,
      completedAt: null,
    });

    await ctx.db.patch(session._id, {
      status: "in_progress",
      currentRoundNumber: roundNumber,
      activeRoundId: roundId,
      participationWindowStatus: "open",
      updatedAt: now,
    });

    const round = await ctx.db.get(roundId);
    if (!round) {
      createJoinError(
        JOIN_ERROR_CODES.noActiveRound,
        "The quiz round could not be loaded after it started.",
      );
    }

    await createBatchAssignments(ctx, session._id, round, 1);

    return {
      roundId,
      roundNumber,
    };
  },
});

export const getPlayerQuizState = query({
  args: {
    joinCode: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) =>
        q.eq("joinCode", args.joinCode.trim().toUpperCase()),
      )
      .unique();

    if (!session || session.status === "completed") {
      return null;
    }

    const player = await ctx.db
      .query("playerEntries")
      .withIndex("by_session_and_device", (q) =>
        q.eq("sessionId", session._id).eq("deviceId", args.deviceId.trim()),
      )
      .unique();

    if (!player || player.joinStatus !== "joined") {
      return {
        session: {
          joinCode: session.joinCode,
          currentRoundNumber: session.currentRoundNumber,
          participationWindowStatus: session.participationWindowStatus,
          status: session.status,
          battleJoinStatus: getSessionBattleJoinStatus(session),
          activeEncounterId: session.activeEncounterId ?? null,
        },
        player: null,
        playerEntryId: null,
        activeRound: null,
        assignment: null,
        latestResult: null,
        combatant: null,
        partySummary: null,
        availableSkills: [],
        battleStatus: session.activeEncounterId
          ? "active_battle"
          : "pre_battle",
        joinBlockReason: session.activeEncounterId
          ? "battle_join_blocked"
          : null,
      };
    }

    const activeRound = session.activeRoundId
      ? await ctx.db.get(session.activeRoundId)
      : null;
    const activeEncounter = session.activeEncounterId
      ? await ctx.db.get(session.activeEncounterId)
      : null;
    const combatant = activeEncounter
      ? await ctx.db
          .query("combatantStates")
          .withIndex("by_player_entry", (q) =>
            q.eq("playerEntryId", player._id),
          )
          .unique()
      : null;
    const encounterCombatants = activeEncounter
      ? await ctx.db
          .query("combatantStates")
          .withIndex("by_encounter", (q) =>
            q.eq("encounterId", activeEncounter._id),
          )
          .collect()
      : [];

    const playerAssignments = (
      await ctx.db
        .query("quizAssignments")
        .withIndex("by_player", (q) => q.eq("playerEntryId", player._id))
        .collect()
    ).sort((left, right) => right.assignedAt - left.assignedAt);

    const activeAssignment = playerAssignments.find(
      (assignment) =>
        assignment.status === "presented" &&
        (!activeRound || assignment.roundId === activeRound._id),
    );

    const latestAssignment = playerAssignments.find(
      (assignment) => assignment.status === "scored",
    );

    const assignmentQuestion = activeAssignment
      ? await ctx.db.get(activeAssignment.quizQuestionId)
      : null;

    const latestAnswer = latestAssignment
      ? await ctx.db
          .query("quizAnswers")
          .withIndex("by_assignment", (q) =>
            q.eq("assignmentId", latestAssignment._id),
          )
          .unique()
      : null;

    return {
      session: {
        joinCode: session.joinCode,
        currentRoundNumber: session.currentRoundNumber,
        participationWindowStatus: session.participationWindowStatus,
        status: session.status,
        battleJoinStatus: getSessionBattleJoinStatus(session),
        activeEncounterId: session.activeEncounterId ?? null,
      },
      player: {
        displayName: player.displayName,
        eligibleFromRoundNumber: player.eligibleFromRoundNumber,
        nextQuizAdvantage: getPlayerNextQuizAdvantage(player),
        tokenBalance: player.tokenBalance,
      },
      playerEntryId: player._id,
      activeRound: activeRound
        ? {
            roundNumber: activeRound.roundNumber,
            status: activeRound.status,
            questionTarget: activeRound.questionTarget,
            questionsCompleted: activeRound.questionsCompleted,
            remainingQuestions:
              activeRound.questionTarget - activeRound.questionsCompleted,
            allowedCategories: activeRound.allowedCategories,
            allowedComplexities: activeRound.allowedComplexities,
          }
        : null,
      assignment:
        activeAssignment && assignmentQuestion
          ? {
              assignmentId: activeAssignment._id,
              prompt: assignmentQuestion.prompt,
              choices: assignmentQuestion.choices,
              roundNumber:
                activeRound?.roundNumber ?? session.currentRoundNumber,
              questionNumber: activeAssignment.batchNumber,
            }
          : null,
      latestResult:
        latestAssignment && latestAnswer
          ? {
              assignmentId: latestAssignment._id,
              awardedTokens: latestAssignment.awardedTokens,
              evaluationResult: latestAnswer.evaluationResult,
              submittedChoiceId: latestAnswer.submittedChoiceId,
            }
          : null,
      combatant: combatant
        ? {
            encounterId: combatant.encounterId,
            currentActionPoints: combatant.currentActionPoints,
            currentHealth: combatant.currentHealth,
            displayName: combatant.displayName,
            fallbackSpriteKey: combatant.fallbackSpriteKey,
            id: combatant._id,
            maxHealth: combatant.maxHealth,
            nextQuizAdvantage: combatant.nextQuizAdvantage,
            spriteRef: combatant.spriteRef,
            state: combatant.state,
          }
        : null,
      partySummary: activeEncounter
        ? {
            activePlayers: encounterCombatants.filter(
              (currentCombatant) =>
                currentCombatant.combatantType === "player" &&
                currentCombatant.state === "active",
            ).length,
            currentHealth: activeEncounter.partyCurrentHealth,
            knockedOutPlayers: encounterCombatants.filter(
              (currentCombatant) =>
                currentCombatant.combatantType === "player" &&
                currentCombatant.state === "knocked_out",
            ).length,
            maxHealth: activeEncounter.partyMaxHealth,
          }
        : null,
      availableSkills: combatant
        ? (
            await Promise.all(
              combatant.availableSkillIds.map(
                (skillId: Id<"skillDefinitions">) => ctx.db.get(skillId),
              ),
            )
          )
            .filter(isSkillDefinition)
            .map((skill: Doc<"skillDefinitions">) => ({
              actionPointCost: skill.actionPointCost,
              available: combatant.currentActionPoints >= skill.actionPointCost,
              category: skill.category,
              id: skill._id,
              name: skill.name,
            }))
        : [],
      battleStatus: activeEncounter
        ? activeEncounter.status === "active"
          ? activeAssignment
            ? "active_quiz"
            : "active_battle"
          : activeEncounter.status
        : "pre_battle",
      joinBlockReason: null,
    };
  },
});
