import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HostSessionLauncher } from "@/components/join/host-session-launcher";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import {
  getJoinErrorDetails,
  useCreateSessionMutation,
  useCurrentActiveSession,
} from "@/integrations/convex/join";

export const Route = createFileRoute("/")({ component: HomePage });

const CREATE_SESSION_TIMEOUT_MS = 10_000;

function createSessionTimeoutError() {
  return new Error(
    "Session creation timed out. Check the Convex connection and try again.",
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const currentActiveSession = useCurrentActiveSession();
  const createSession = useCreateSessionMutation();
  const [creatingSession, setCreatingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8 px-6 py-12">
      <HostSessionLauncher
        activeJoinCode={currentActiveSession?.joinCode}
        pending={creatingSession}
        onCreateSession={() => {
          setCreatingSession(true);
          setErrorMessage(null);
          const timeoutPromise = new Promise<never>((_, reject) => {
            window.setTimeout(() => {
              reject(createSessionTimeoutError());
            }, CREATE_SESSION_TIMEOUT_MS);
          });

          void Promise.race([createSession(), timeoutPromise])
            .then((result) => {
              void navigate({
                to: "/host/$joinCode",
                params: { joinCode: result.joinCode },
              });
            })
            .catch((error: unknown) => {
              const details = getJoinErrorDetails(error);
              setErrorMessage(
                getJoinErrorMessage(details.code, details.message),
              );
              console.error("Failed to create session.", {
                action: "create_session",
                message: details.message,
              });
            })
            .finally(() => {
              setCreatingSession(false);
            });
        }}
        onResumeSession={
          currentActiveSession
            ? () => {
                void navigate({
                  to: "/host/$joinCode",
                  params: { joinCode: currentActiveSession.joinCode },
                });
              }
            : undefined
        }
      />

      {errorMessage ? (
        <p className="border-4 border-rose-400/50 bg-rose-950/40 px-4 py-3 text-rose-200 text-sm">
          {errorMessage}
        </p>
      ) : null}
    </main>
  );
}
