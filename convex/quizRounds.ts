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

function getRoundPhase(round: Doc<"gameRounds">) {
  return round.phase ?? "quiz";
}

function chooseExchangeLimit() {
  return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
}

async function getJoinedPlayers(
  ctx: QuizAccessCtx,
  sessionId: Id<"gameSessions">,
  roundNumber: number,
): Promise<Doc<"playerEntries">[]> {
  const session = await ctx.db.get(sessionId);
  const encounterId = session?.activeEncounterId ?? null;
  const players = await ctx.db
    .query("playerEntries")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  const combatants = encounterId
    ? await ctx.db
        .query("combatantStates")
        .withIndex("by_encounter", (q) => q.eq("encounterId", encounterId))
        .collect()
    : [];
  const knockedOutPlayers = new Set(
    combatants
      .filter(
        (combatant) =>
          combatant.combatantType === "player" &&
          combatant.playerEntryId &&
          combatant.state === "knocked_out",
      )
      .map((combatant) => combatant.playerEntryId as Id<"playerEntries">),
  );

  return players.filter(
    (player) =>
      player.joinStatus === "joined" &&
      player.eligibleFromRoundNumber <= roundNumber &&
      !knockedOutPlayers.has(player._id),
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

async function getRoundParticipants(
  ctx: QuizAccessCtx,
  roundId: Id<"gameRounds">,
) {
  return await ctx.db
    .query("roundParticipants")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();
}

async function createRoundParticipants(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  roundId: Id<"gameRounds">,
  roundNumber: number,
) {
  const players = await getJoinedPlayers(ctx, sessionId, roundNumber);
  const now = Date.now();

  for (const player of players) {
    await ctx.db.insert("roundParticipants", {
      sessionId,
      roundId,
      playerEntryId: player._id,
      status: "active",
      completedQuizAt: null,
      removedAt: null,
      canReturnNextRound: true,
    });

    await ctx.db.patch(player._id, {
      lastSeenAt: now,
    });
  }
}

function isSkillDefinition(
  skill: Doc<"skillDefinitions"> | null,
): skill is Doc<"skillDefinitions"> {
  return skill !== null;
}

function getBattleStatus(input: {
  activeAssignment: Doc<"quizAssignments"> | undefined;
  activeEncounter: Doc<"battleEncounters"> | null;
  activeRound: Doc<"gameRounds"> | null;
  gamePhase: string | null | undefined;
  results: boolean;
  roundParticipantStatus: Doc<"roundParticipants">["status"] | null;
}) {
  if (input.results) {
    return "results";
  }

  if (!input.activeEncounter) {
    return "pre_battle";
  }

  if (input.activeAssignment) {
    return "active_quiz";
  }

  if (input.gamePhase === "waiting_for_players") {
    return "waiting_for_players";
  }

  if (input.activeRound?.phase === "action_selection") {
    if (input.roundParticipantStatus === "action_ready") {
      return "battle_resolution";
    }

    return input.roundParticipantStatus === "removed_disconnected"
      ? "removed_from_round"
      : "action_selection";
  }

  if (input.activeRound?.phase === "battle_resolution") {
    return "battle_resolution";
  }

  return "active_battle";
}

async function createBatchAssignments(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  round: Doc<"gameRounds">,
  batchNumber: number,
) {
  const participants = await getRoundParticipants(ctx, round._id);
  const playerEntries = await getJoinedPlayers(
    ctx,
    sessionId,
    round.roundNumber,
  );
  const players = playerEntries.filter((player) => {
    const participant = participants.find(
      (currentParticipant) => currentParticipant.playerEntryId === player._id,
    );

    return participant
      ? participant.status !== "removed_disconnected" &&
          participant.status !== "knocked_out"
      : true;
  });
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

async function createRoundAssignments(
  ctx: MutationCtx,
  sessionId: Id<"gameSessions">,
  round: Doc<"gameRounds">,
) {
  for (
    let batchNumber = 1;
    batchNumber <= round.questionTarget;
    batchNumber += 1
  ) {
    await createBatchAssignments(ctx, sessionId, round, batchNumber);
  }
}

export async function advanceRoundIfNeeded(
  ctx: MutationCtx,
  roundId: Id<"gameRounds">,
) {
  const round = await ctx.db.get(roundId);
  if (!round || round.status !== "active") {
    return;
  }

  const roundAssignments = (
    await ctx.db
      .query("quizAssignments")
      .withIndex("by_round", (q) => q.eq("roundId", roundId))
      .collect()
  ).filter(
    (assignment) =>
      assignment.status === "presented" || assignment.status === "answered",
  );
  const now = Date.now();

  if (roundAssignments.length > 0) {
    if (getRoundPhase(round) !== "waiting_for_players") {
      await ctx.db.patch(round._id, {
        phase: "waiting_for_players",
      });

      const waitingSession = await ctx.db.get(round.sessionId);
      if (waitingSession) {
        await ctx.db.patch(waitingSession._id, {
          gamePhase: "waiting_for_players",
          updatedAt: now,
        });
      }
    }

    return;
  }

  const nextCompleted = round.questionTarget;
  const session = await ctx.db.get(round.sessionId);
  if (!session) {
    return;
  }

  const roundAnswers = await ctx.db
    .query("quizAnswers")
    .withIndex("by_round", (q) => q.eq("roundId", round._id))
    .collect();
  const earnedTokensByPlayer = new Map<Id<"playerEntries">, number>();
  for (const answer of roundAnswers) {
    earnedTokensByPlayer.set(
      answer.playerEntryId,
      (earnedTokensByPlayer.get(answer.playerEntryId) ?? 0) +
        answer.awardedTokens,
    );
  }

  const participants = await getRoundParticipants(ctx, round._id);
  for (const participant of participants) {
    const earnedTokens =
      earnedTokensByPlayer.get(participant.playerEntryId) ?? 0;
    await ctx.db.patch(participant._id, {
      status:
        participant.status === "removed_disconnected"
          ? participant.status
          : earnedTokens > 0
            ? "quiz_complete"
            : "action_ready",
      completedQuizAt: participant.completedQuizAt ?? now,
    });
  }

  const encounterId = session.activeEncounterId ?? null;
  if (encounterId) {
    const combatants = await ctx.db
      .query("combatantStates")
      .withIndex("by_encounter", (q) => q.eq("encounterId", encounterId))
      .collect();

    for (const combatant of combatants) {
      if (combatant.combatantType !== "player" || !combatant.playerEntryId) {
        continue;
      }

      const earnedTokens =
        earnedTokensByPlayer.get(combatant.playerEntryId) ?? 0;
      await ctx.db.patch(combatant._id, {
        currentActionPoints: earnedTokens,
        actionPointsPerRound: earnedTokens,
        pendingEffectIds: [],
        lastUpdatedAt: now,
      });
    }
  }

  await ctx.db.patch(round._id, {
    questionsCompleted: nextCompleted,
    phase: "action_selection",
  });
  await ctx.db.patch(session._id, {
    participationWindowStatus: "locked",
    gamePhase: "action_selection",
    updatedAt: now,
    status: "in_progress",
  });
}

export async function startRoundForSession(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  config: {
    allowedCategories: string[];
    allowedComplexities: string[];
    questionTarget: number;
  },
) {
  const validationError = validateRoundConfig(
    config.questionTarget,
    config.allowedCategories,
    config.allowedComplexities,
  );
  if (validationError) {
    createJoinError(JOIN_ERROR_CODES.invalidRoundConfig, validationError);
  }

  if (session.activeRoundId) {
    createJoinError(
      JOIN_ERROR_CODES.invalidRoundConfig,
      "A round is already active for this session.",
    );
  }

  await ensureQuestionBankLoaded(ctx);

  const roundNumber = session.currentRoundNumber + 1;
  const eligiblePlayers = await getJoinedPlayers(ctx, session._id, roundNumber);
  const questions = await getReadyQuestionsForRules(
    ctx,
    config.allowedCategories,
    config.allowedComplexities,
  );
  const priorAssignments = await getPriorAssignments(ctx, session._id);

  if (
    !canSatisfyRoundForPlayers(
      eligiblePlayers,
      questions,
      priorAssignments,
      config.questionTarget,
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
    questionTarget: config.questionTarget,
    questionsCompleted: 0,
    allowedCategories: config.allowedCategories,
    allowedComplexities: config.allowedComplexities,
    exchangeLimit: chooseExchangeLimit(),
    exchangesResolved: 0,
    phase: "quiz",
    createdByHostAt: now,
    startedAt: now,
    completedAt: null,
  });

  await createRoundParticipants(ctx, session._id, roundId, roundNumber);

  await ctx.db.patch(session._id, {
    status: "in_progress",
    currentRoundNumber: roundNumber,
    activeRoundId: roundId,
    participationWindowStatus: "locked",
    gamePhase: "quiz",
    updatedAt: now,
  });

  const round = await ctx.db.get(roundId);
  if (!round) {
    createJoinError(
      JOIN_ERROR_CODES.noActiveRound,
      "The quiz round could not be loaded after it started.",
    );
  }

  await createRoundAssignments(ctx, session._id, round);

  return {
    roundId,
    roundNumber,
  };
}

export const startRound = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    questionTarget: v.number(),
    allowedCategories: v.array(v.string()),
    allowedComplexities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status === "completed") {
      createJoinError(
        JOIN_ERROR_CODES.sessionNotFound,
        "The requested session could not be found.",
      );
    }

    return await startRoundForSession(ctx, session, {
      questionTarget: args.questionTarget,
      allowedCategories: args.allowedCategories,
      allowedComplexities: args.allowedComplexities,
    });
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

    if (!session) {
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
          gamePhase: session.gamePhase ?? "lobby",
        },
        player: null,
        playerEntryId: null,
        activeRound: null,
        assignments: [],
        assignment: null,
        latestResult: null,
        roundParticipant: null,
        combatant: null,
        partySummary: null,
        availableSkills: [],
        availableTargets: [],
        battleStatus: session.activeEncounterId
          ? "active_battle"
          : "pre_battle",
        joinBlockReason: session.activeEncounterId
          ? "battle_join_blocked"
          : null,
        results:
          session.completedAt !== null
            ? {
                completedAt: session.completedAt,
                completionReason: session.completionReason ?? "host_ended",
              }
            : null,
      };
    }

    const activeRound = session.activeRoundId
      ? await ctx.db.get(session.activeRoundId)
      : null;
    const activeEncounter = session.activeEncounterId
      ? await ctx.db.get(session.activeEncounterId)
      : null;
    const roundParticipant =
      activeRound && player
        ? await ctx.db
            .query("roundParticipants")
            .withIndex("by_round_and_player", (q) =>
              q.eq("roundId", activeRound._id).eq("playerEntryId", player._id),
            )
            .unique()
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
    const activeAssignments = playerAssignments
      .filter(
        (assignment) =>
          assignment.status === "presented" &&
          (!activeRound || assignment.roundId === activeRound._id),
      )
      .sort((left, right) => left.batchNumber - right.batchNumber);

    const latestAssignment = playerAssignments.find(
      (assignment) => assignment.status === "scored",
    );

    const activeAssignmentQuestions = await Promise.all(
      activeAssignments.map(async (assignment) => ({
        assignment,
        question: await ctx.db.get(assignment.quizQuestionId),
      })),
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
    const results =
      session.completedAt !== null
        ? {
            completedAt: session.completedAt,
            completionReason: session.completionReason ?? "host_ended",
          }
        : null;
    const availableTargets = activeEncounter
      ? encounterCombatants
          .filter((currentCombatant) => currentCombatant.state === "active")
          .map((currentCombatant) => ({
            combatantType: currentCombatant.combatantType,
            displayName: currentCombatant.displayName,
            id: currentCombatant._id,
          }))
      : [];
    const battleStatus = getBattleStatus({
      activeAssignment,
      activeEncounter,
      activeRound,
      gamePhase: session.gamePhase ?? null,
      results: Boolean(results),
      roundParticipantStatus: roundParticipant?.status ?? null,
    });

    return {
      session: {
        joinCode: session.joinCode,
        currentRoundNumber: session.currentRoundNumber,
        participationWindowStatus: session.participationWindowStatus,
        status: session.status,
        battleJoinStatus: getSessionBattleJoinStatus(session),
        activeEncounterId: session.activeEncounterId ?? null,
        gamePhase: session.gamePhase ?? "lobby",
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
            id: activeRound._id,
            roundNumber: activeRound.roundNumber,
            status: activeRound.status,
            questionTarget: activeRound.questionTarget,
            questionsCompleted: activeRound.questionsCompleted,
            remainingQuestions:
              activeRound.questionTarget - activeRound.questionsCompleted,
            allowedCategories: activeRound.allowedCategories,
            allowedComplexities: activeRound.allowedComplexities,
            exchangeLimit: activeRound.exchangeLimit ?? null,
            exchangesResolved: activeRound.exchangesResolved ?? 0,
            phase: activeRound.phase ?? "quiz",
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
      assignments: activeAssignmentQuestions
        .filter(
          (
            entry,
          ): entry is {
            assignment: Doc<"quizAssignments">;
            question: Doc<"quizQuestions">;
          } => entry.question !== null,
        )
        .map((entry) => ({
          assignmentId: entry.assignment._id,
          choices: entry.question.choices,
          prompt: entry.question.prompt,
          questionNumber: entry.assignment.batchNumber,
          roundNumber: activeRound?.roundNumber ?? session.currentRoundNumber,
        })),
      latestResult:
        latestAssignment && latestAnswer
          ? {
              assignmentId: latestAssignment._id,
              awardedTokens: latestAssignment.awardedTokens,
              evaluationResult: latestAnswer.evaluationResult,
              submittedChoiceId: latestAnswer.submittedChoiceId,
            }
          : null,
      roundParticipant: roundParticipant
        ? {
            canReturnNextRound: roundParticipant.canReturnNextRound,
            status: roundParticipant.status,
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
              available:
                combatant.currentActionPoints >= skill.actionPointCost &&
                roundParticipant?.status !== "action_ready",
              category: skill.category,
              id: skill._id,
              name: skill.name,
              targetScope: skill.targetScope,
            }))
        : [],
      availableTargets,
      battleStatus,
      joinBlockReason:
        roundParticipant?.status === "removed_disconnected"
          ? "battle_join_blocked"
          : null,
      results,
    };
  },
});
