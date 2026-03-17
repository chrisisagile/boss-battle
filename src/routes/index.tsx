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

export function HomePage() {
  const navigate = useNavigate();
  const currentActiveSession = useCurrentActiveSession();
  const createSession = useCreateSessionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8 px-6 py-12">
      <HostSessionLauncher
        activeJoinCode={currentActiveSession?.joinCode}
        onCreateSession={() => {
          setErrorMessage(null);
          void createSession()
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
