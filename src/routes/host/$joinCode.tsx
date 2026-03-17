import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HostJoinStatusToggle } from "@/components/join/host-join-status-toggle";
import { HostRoster } from "@/components/join/host-roster";
import { HostSessionHero } from "@/components/join/host-session-hero";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import {
  getJoinErrorDetails,
  logHostSessionLoadIssue,
  logJoinStatusFailure,
  useHostOverview,
  useSetJoinStatusMutation,
} from "@/integrations/convex/join";

export const Route = createFileRoute("/host/$joinCode")({
  component: HostRouteComponent,
});

export function HostSessionPage({ joinCode }: { joinCode: string }) {
  const overview = useHostOverview(joinCode);
  const setJoinStatus = useSetJoinStatusMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/join/${joinCode}`;
    }

    return new URL(`/join/${joinCode}`, window.location.origin).toString();
  }, [joinCode]);

  useEffect(() => {
    if (overview === null) {
      logHostSessionLoadIssue({
        joinCode,
        reason: "unavailable",
      });
    }
  }, [joinCode, overview]);

  if (overview === undefined) {
    return (
      <HostPageState
        heading="Loading session..."
        body="Pulling the live roster and join code from Convex."
      />
    );
  }

  if (!overview) {
    return (
      <HostPageState
        heading="Session unavailable"
        body="The requested lobby is missing or has already ended."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <HostSessionHero
        joinCode={overview.session.joinCode}
        joinStatus={overview.session.joinStatus}
        joinUrl={joinUrl}
        joinedPlayerCount={overview.joinedPlayerCount}
        lateJoinerCount={overview.lateJoinerCount}
      />

      <HostJoinStatusToggle
        joinStatus={overview.session.joinStatus}
        onToggle={() => {
          const nextJoinStatus =
            overview.session.joinStatus === "open" ? "closed" : "open";

          void setJoinStatus({
            sessionId: overview.session._id,
            joinStatus: nextJoinStatus,
          }).catch((error: unknown) => {
            const details = getJoinErrorDetails(error);
            setErrorMessage(getJoinErrorMessage(details.code, details.message));
            logJoinStatusFailure({
              joinCode,
              nextJoinStatus,
              message: details.message,
            });
          });
        }}
      />

      {errorMessage ? (
        <p className="border-4 border-rose-400/50 bg-rose-950/40 px-4 py-3 text-rose-200 text-sm">
          {errorMessage}
        </p>
      ) : null}

      <HostRoster
        currentRoundNumber={overview.session.currentRoundNumber}
        players={overview.roster}
      />
    </main>
  );
}

function HostRouteComponent() {
  const { joinCode } = Route.useParams();
  return <HostSessionPage joinCode={joinCode} />;
}

function HostPageState({ body, heading }: { body: string; heading: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center px-6 py-16">
      <section className="border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.55)]">
        <h1 className="font-black text-3xl tracking-tight">{heading}</h1>
        <p className="mt-4 text-base text-stone-300 leading-7">{body}</p>
      </section>
    </main>
  );
}
