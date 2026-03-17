import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getBattleErrorMessage } from "@/components/join/battle-status-messages";
import { getOrCreateDeviceId } from "@/components/join/device-id";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import { PlayerBattleProfile } from "@/components/join/player-battle-profile";
import { PlayerJoinConfirmation } from "@/components/join/player-join-confirmation";
import { PlayerNameForm } from "@/components/join/player-name-form";
import { PlayerQuizQuestion } from "@/components/join/player-quiz-question";
import { PlayerQuizResult } from "@/components/join/player-quiz-result";
import { getQuizErrorMessage } from "@/components/join/quiz-status-messages";
import { RoundChapterIntro } from "@/components/join/round-chapter-intro";
import {
  getJoinErrorDetails,
  logBattleActionFailure,
  logEncounterTransition,
  logJoinSubmissionFailure,
  logQuizAnswerFailure,
  useJoinableSession,
  useJoinSessionMutation,
  usePlayerQuizState,
  useSubmitBattleActionMutation,
  useSubmitQuizAnswerBatchMutation,
} from "@/integrations/convex/join";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/join/$joinCode")({
  component: JoinByCodeRouteComponent,
});

interface JoinedState {
  currentRoundNumber: number;
  displayName: string;
  eligibleFromRoundNumber: number;
  tokenBalance?: number;
}

export function JoinByCodePage({ joinCode }: { joinCode: string }) {
  const joinableSession = useJoinableSession(joinCode);
  const joinSession = useJoinSessionMutation();
  const submitBattleAction = useSubmitBattleActionMutation();
  const submitQuizAnswers = useSubmitQuizAnswerBatchMutation();
  const deviceId = getOrCreateDeviceId();
  const playerQuizState = usePlayerQuizState(joinCode, deviceId);
  const [joinedState, setJoinedState] = useState<JoinedState | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [battleError, setBattleError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [introRoundNumber, setIntroRoundNumber] = useState<number | null>(null);
  const previousBattleStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (joinableSession && !joinableSession.available) {
      logJoinSubmissionFailure({
        joinCode,
        message: `join_unavailable:${joinableSession.reason}`,
      });
    }
  }, [joinCode, joinableSession]);

  useEffect(() => {
    const nextActiveRound = playerQuizState?.activeRound;
    if (nextActiveRound) {
      setIntroRoundNumber((current) =>
        current === null ? nextActiveRound.roundNumber : current,
      );
    }
  }, [playerQuizState?.activeRound]);

  useEffect(() => {
    if (!playerQuizState) {
      return;
    }

    const nextState = playerQuizState.combatant
      ? `${playerQuizState.combatant.encounterId}:${playerQuizState.battleStatus}`
      : playerQuizState.battleStatus;
    const previousState = previousBattleStateRef.current;

    if (previousState && previousState !== nextState) {
      logEncounterTransition({
        encounterId: playerQuizState.combatant?.encounterId ?? null,
        joinCode,
        nextState,
        previousState,
        role: "player",
      });
    }

    previousBattleStateRef.current = nextState;
  }, [joinCode, playerQuizState]);

  if (joinableSession === undefined) {
    return (
      <JoinPageState
        heading="Checking the lobby..."
        body="Making sure this session is still available to join."
      />
    );
  }

  if (!joinableSession?.available) {
    return (
      <JoinPageState
        heading="That session is unavailable."
        body="The join code is invalid, closed, or the battle has already ended."
      />
    );
  }

  if (playerQuizState === undefined) {
    return (
      <JoinPageState
        heading="Syncing quiz status..."
        body="Checking whether this player already has a live quiz question."
      />
    );
  }

  if (playerQuizState === null) {
    return (
      <JoinPageState
        heading="That session is unavailable."
        body="The quiz state could not be loaded because the session is no longer active."
      />
    );
  }

  const joinedPlayer = playerQuizState.player ?? joinedState;
  const activeRound = playerQuizState.activeRound;
  const activeAssignments = playerQuizState.assignments ?? [];
  const latestResult = playerQuizState.latestResult;
  const resolvedJoinCode = joinableSession.joinCode ?? joinCode;
  const shouldShowRoundIntro =
    activeRound &&
    introRoundNumber === activeRound.roundNumber &&
    activeAssignments.length > 0;
  const blockedNewJoin =
    !joinedPlayer && joinableSession.joinBlockedReason === "closed";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col gap-6 px-6 py-10">
      {!joinedPlayer && !blockedNewJoin ? (
        <RoundChapterIntro
          description="Enter a display name so the host can see you on the shared roster. You only need your phone and the room code."
          questionTarget={1}
          roundNumber={0}
        />
      ) : null}

      {blockedNewJoin ? (
        <JoinPageState
          heading="Joining is locked."
          body="This game has already started. New players cannot join until the host starts a fresh room."
        />
      ) : !joinedPlayer ? (
        <PlayerNameForm
          busy={busy}
          errorMessage={joinError}
          onSubmit={(displayName) => {
            setBusy(true);
            setJoinError(null);

            void joinSession({
              joinCode: resolvedJoinCode,
              displayName,
              deviceId,
            })
              .then((result) => {
                setJoinedState({
                  currentRoundNumber: result.currentRoundNumber,
                  displayName: result.displayName,
                  eligibleFromRoundNumber: result.eligibleFromRoundNumber,
                  tokenBalance: result.tokenBalance,
                });
              })
              .catch((error: unknown) => {
                const details = getJoinErrorDetails(error);
                setJoinError(
                  getJoinErrorMessage(details.code, details.message),
                );
                logJoinSubmissionFailure({
                  joinCode,
                  message: details.message,
                });
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        />
      ) : shouldShowRoundIntro && activeRound ? (
        <RoundChapterIntro
          description="The projector and your phone are both announcing the next quiz wave. Step in when you are ready."
          questionTarget={activeRound.questionTarget}
          roundNumber={activeRound.roundNumber}
          onContinue={() => setIntroRoundNumber(null)}
        />
      ) : activeAssignments.length > 0 && activeRound ? (
        <PlayerQuizQuestion
          busy={answerBusy}
          errorMessage={quizError}
          questions={activeAssignments}
          roundNumber={activeRound.roundNumber}
          onSubmit={(answers) => {
            setAnswerBusy(true);
            setQuizError(null);
            void submitQuizAnswers({
              answers: answers.map((answer) => ({
                assignmentId: answer.assignmentId as Id<"quizAssignments">,
                submittedChoiceId: answer.submittedChoiceId,
              })),
            })
              .catch((error: unknown) => {
                const details = getJoinErrorDetails(error);
                setQuizError(
                  getQuizErrorMessage(details.code, details.message),
                );
                logQuizAnswerFailure({
                  joinCode,
                  message: details.message,
                });
              })
              .finally(() => {
                setAnswerBusy(false);
              });
          }}
        />
      ) : playerQuizState.combatant &&
        joinedPlayer &&
        ["action_selection", "active_battle", "battle_resolution"].includes(
          playerQuizState.battleStatus,
        ) ? (
        <PlayerBattleProfile
          availableSkills={playerQuizState.availableSkills}
          availableTargets={playerQuizState.availableTargets}
          battleActivity={playerQuizState.battleActivity}
          currentActionPoints={playerQuizState.combatant.currentActionPoints}
          currentHealth={playerQuizState.combatant.currentHealth}
          errorMessage={battleError}
          maxActionPoints={playerQuizState.combatant.maxActionPoints}
          maxHealth={playerQuizState.combatant.maxHealth}
          name={joinedPlayer.displayName}
          nextQuizAdvantage={playerQuizState.combatant.nextQuizAdvantage}
          onUseSkill={(skillId, targetId) => {
            if (playerQuizState.battleStatus === "battle_resolution") {
              return;
            }
            if (
              !playerQuizState.playerEntryId ||
              !playerQuizState.combatant?.encounterId ||
              !playerQuizState.activeRound
            ) {
              setBattleError(
                "Battle state is unavailable. Refresh and try again.",
              );
              return;
            }

            setBattleError(null);
            void submitBattleAction({
              encounterId: playerQuizState.combatant.encounterId,
              playerEntryId: playerQuizState.playerEntryId,
              roundId: playerQuizState.activeRound.id as Id<"gameRounds">,
              skillId: skillId as Id<"skillDefinitions">,
              targetId: targetId ? (targetId as Id<"combatantStates">) : null,
            }).catch((error: unknown) => {
              const details = getJoinErrorDetails(error);
              setBattleError(
                getBattleErrorMessage(details.code, details.message),
              );
              logBattleActionFailure({
                joinCode,
                message: details.message,
              });
            });
          }}
          state={playerQuizState.combatant.state}
        />
      ) : joinedPlayer &&
        playerQuizState.battleStatus === "removed_from_round" ? (
        <JoinPageState
          heading="Round complete for now"
          body="You were removed from the active round. Stay connected and you can return when the next round begins."
        />
      ) : joinedPlayer &&
        activeRound &&
        ["active_quiz", "waiting_for_players"].includes(
          playerQuizState.battleStatus,
        ) ? (
        <JoinPageState
          heading="Waiting for the room..."
          body="Stay on this screen. Your next quiz question or battle prompt will appear automatically."
        />
      ) : playerQuizState.results ? (
        <JoinPageState
          heading="Game Over"
          body={`Outcome: ${playerQuizState.results.completionReason}. The host must start a fresh room for another run.`}
        />
      ) : latestResult && joinedPlayer ? (
        <PlayerQuizResult
          awardedTokens={latestResult.awardedTokens}
          evaluationResult={latestResult.evaluationResult}
          tokenBalance={
            playerQuizState.player?.tokenBalance ??
            joinedState?.tokenBalance ??
            0
          }
        />
      ) : joinedPlayer ? (
        <PlayerJoinConfirmation
          currentRoundNumber={
            playerQuizState.player
              ? playerQuizState.session.currentRoundNumber
              : (joinedState?.currentRoundNumber ?? 0)
          }
          displayName={joinedPlayer.displayName}
          eligibleFromRoundNumber={joinedPlayer.eligibleFromRoundNumber}
        />
      ) : (
        <JoinPageState
          heading="Waiting for the next quiz beat..."
          body="Stay on this screen. Your next prompt will appear here as soon as the host starts the next round."
        />
      )}
    </main>
  );
}

function JoinByCodeRouteComponent() {
  const { joinCode } = Route.useParams();
  return <JoinByCodePage joinCode={joinCode} />;
}

function JoinPageState({ body, heading }: { body: string; heading: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center px-6 py-16">
      <section className="border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.55)]">
        <h1 className="font-black text-3xl tracking-tight">{heading}</h1>
        <p className="mt-4 text-base text-stone-300 leading-7">{body}</p>
      </section>
    </main>
  );
}
