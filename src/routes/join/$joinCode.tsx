import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrCreateDeviceId } from "@/components/join/device-id";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import { PlayerJoinConfirmation } from "@/components/join/player-join-confirmation";
import { PlayerNameForm } from "@/components/join/player-name-form";
import { PlayerQuizQuestion } from "@/components/join/player-quiz-question";
import { PlayerQuizResult } from "@/components/join/player-quiz-result";
import { getQuizErrorMessage } from "@/components/join/quiz-status-messages";
import { RoundChapterIntro } from "@/components/join/round-chapter-intro";
import {
  getJoinErrorDetails,
  logJoinSubmissionFailure,
  logQuizAnswerFailure,
  useJoinableSession,
  useJoinSessionMutation,
  usePlayerQuizState,
  useSubmitQuizAnswerMutation,
} from "@/integrations/convex/join";

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
  const submitQuizAnswer = useSubmitQuizAnswerMutation();
  const deviceId = getOrCreateDeviceId();
  const playerQuizState = usePlayerQuizState(joinCode, deviceId);
  const [joinedState, setJoinedState] = useState<JoinedState | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [introRoundNumber, setIntroRoundNumber] = useState<number | null>(null);

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
  const activeAssignment = playerQuizState.assignment;
  const latestResult = playerQuizState.latestResult;
  const shouldShowRoundIntro =
    activeRound &&
    introRoundNumber === activeRound.roundNumber &&
    Boolean(activeAssignment);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col gap-6 px-6 py-10">
      {!joinedPlayer ? (
        <RoundChapterIntro
          description="Enter a display name so the host can see you on the shared roster. You only need your phone and the room code."
          questionTarget={1}
          roundNumber={0}
        />
      ) : null}

      {!joinedPlayer ? (
        <PlayerNameForm
          busy={busy}
          errorMessage={joinError}
          onSubmit={(displayName) => {
            setBusy(true);
            setJoinError(null);

            void joinSession({
              joinCode: joinableSession.joinCode,
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
      ) : activeAssignment && activeRound ? (
        <PlayerQuizQuestion
          busy={answerBusy}
          choices={activeAssignment.choices}
          errorMessage={quizError}
          prompt={activeAssignment.prompt}
          questionNumber={activeAssignment.questionNumber}
          roundNumber={activeRound.roundNumber}
          onSubmit={(submittedChoiceId) => {
            setAnswerBusy(true);
            setQuizError(null);
            void submitQuizAnswer({
              assignmentId: activeAssignment.assignmentId,
              submittedChoiceId,
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
