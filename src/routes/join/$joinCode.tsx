import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrCreateDeviceId } from "@/components/join/device-id";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import { PlayerJoinConfirmation } from "@/components/join/player-join-confirmation";
import { PlayerNameForm } from "@/components/join/player-name-form";
import { ChapterIntro } from "@/components/ui/8bit/chapter-intro";
import {
  getJoinErrorDetails,
  logJoinSubmissionFailure,
  useJoinableSession,
  useJoinSessionMutation,
} from "@/integrations/convex/join";

export const Route = createFileRoute("/join/$joinCode")({
  component: JoinByCodeRouteComponent,
});

interface JoinedState {
  currentRoundNumber: number;
  displayName: string;
  eligibleFromRoundNumber: number;
}

export function JoinByCodePage({ joinCode }: { joinCode: string }) {
  const joinableSession = useJoinableSession(joinCode);
  const joinSession = useJoinSessionMutation();
  const [joinedState, setJoinedState] = useState<JoinedState | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (joinableSession && !joinableSession.available) {
      logJoinSubmissionFailure({
        joinCode,
        message: `join_unavailable:${joinableSession.reason}`,
      });
    }
  }, [joinCode, joinableSession]);

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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <ChapterIntro
        kicker="Mobile Join"
        title={`Joining session ${joinableSession.joinCode}`}
        description="Enter a display name so the host can see you on the shared roster. You only need your phone and the room code."
      />

      {joinedState ? (
        <PlayerJoinConfirmation
          currentRoundNumber={joinedState.currentRoundNumber}
          displayName={joinedState.displayName}
          eligibleFromRoundNumber={joinedState.eligibleFromRoundNumber}
        />
      ) : (
        <PlayerNameForm
          busy={busy}
          errorMessage={joinError}
          onSubmit={(displayName) => {
            setBusy(true);
            setJoinError(null);

            void joinSession({
              joinCode: joinableSession.joinCode,
              displayName,
              deviceId: getOrCreateDeviceId(),
            })
              .then((result) => {
                setJoinedState({
                  currentRoundNumber: result.currentRoundNumber,
                  displayName: result.displayName,
                  eligibleFromRoundNumber: result.eligibleFromRoundNumber,
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
