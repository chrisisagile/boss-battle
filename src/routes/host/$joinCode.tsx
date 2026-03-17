import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBattleErrorMessage } from "@/components/join/battle-status-messages";
import { HostBattleArena } from "@/components/join/host-battle-arena";
import { HostBattleSetup } from "@/components/join/host-battle-setup";
import { HostJoinStatusToggle } from "@/components/join/host-join-status-toggle";
import { HostQuizRoundControls } from "@/components/join/host-quiz-round-controls";
import { HostQuizRoundStatus } from "@/components/join/host-quiz-round-status";
import { HostRoster } from "@/components/join/host-roster";
import { HostSessionHero } from "@/components/join/host-session-hero";
import { getJoinErrorMessage } from "@/components/join/join-error-messages";
import { QuizPointsLeaderboard } from "@/components/join/quiz-points-leaderboard";
import { getQuizErrorMessage } from "@/components/join/quiz-status-messages";
import { RoundChapterIntro } from "@/components/join/round-chapter-intro";
import {
  getJoinErrorDetails,
  logEncounterTransition,
  logHostSessionLoadIssue,
  logJoinStatusFailure,
  logStartEncounterFailure,
  logStartRoundFailure,
  useBossCatalog,
  useHostOverview,
  useQuestionBankSummary,
  useSetJoinStatusMutation,
  useStartEncounterMutation,
  useStartRoundMutation,
} from "@/integrations/convex/join";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/host/$joinCode")({
  component: HostRouteComponent,
});

export function HostSessionPage({ joinCode }: { joinCode: string }) {
  const overview = useHostOverview(joinCode);
  const bossCatalog = useBossCatalog();
  const questionBankSummary = useQuestionBankSummary();
  const setJoinStatus = useSetJoinStatusMutation();
  const startEncounter = useStartEncounterMutation();
  const startRound = useStartRoundMutation();
  const [battleError, setBattleError] = useState<string | null>(null);
  const [startingBattle, setStartingBattle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [startingRound, setStartingRound] = useState(false);
  const [introRoundNumber, setIntroRoundNumber] = useState<number | null>(null);
  const previousEncounterStateRef = useRef<string | null>(null);
  const activeRound = overview?.activeRound ?? null;

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

  useEffect(() => {
    if (activeRound?.status === "active") {
      setIntroRoundNumber((current) =>
        current === null ? activeRound.roundNumber : current,
      );
    }
  }, [activeRound]);

  useEffect(() => {
    if (!overview) {
      return;
    }

    const nextState = overview.encounter
      ? `${overview.encounter.encounterNumber}:${overview.encounter.status}`
      : (overview.session.battleJoinStatus ?? "pre_battle");
    const previousState = previousEncounterStateRef.current;

    if (previousState && previousState !== nextState) {
      logEncounterTransition({
        encounterId: overview.encounter
          ? `encounter-${overview.encounter.encounterNumber}`
          : null,
        joinCode,
        nextState,
        previousState,
        role: "host",
      });
    }

    previousEncounterStateRef.current = nextState;
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
        activeRound={activeRound}
        joinCode={overview.session.joinCode}
        joinStatus={overview.session.joinStatus}
        joinUrl={joinUrl}
        joinedPlayerCount={overview.joinedPlayerCount}
        lateJoinerCount={overview.lateJoinerCount}
      />

      {!overview.encounter && bossCatalog ? (
        <HostBattleSetup
          bossCatalog={bossCatalog}
          busy={startingBattle}
          errorMessage={battleError}
          onStartEncounter={(bossDefinitionIds) => {
            setStartingBattle(true);
            setBattleError(null);
            void startEncounter({
              bossDefinitionIds: bossDefinitionIds as Id<"bossDefinitions">[],
              sessionId: overview.session._id,
            })
              .catch((error: unknown) => {
                const details = getJoinErrorDetails(error);
                setBattleError(
                  getBattleErrorMessage(details.code, details.message),
                );
                logStartEncounterFailure({
                  joinCode,
                  message: details.message,
                });
              })
              .finally(() => {
                setStartingBattle(false);
              });
          }}
        />
      ) : null}

      {activeRound && introRoundNumber === activeRound.roundNumber ? (
        <RoundChapterIntro
          description="The room can see the round start on the shared projector before the next question batch appears."
          questionTarget={activeRound.questionTarget}
          roundNumber={activeRound.roundNumber}
          onContinue={() => setIntroRoundNumber(null)}
        />
      ) : null}

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

      <HostQuizRoundControls
        availableCategories={
          questionBankSummary?.availableCategories ?? ["history", "science"]
        }
        availableComplexities={
          questionBankSummary?.availableComplexities ?? ["easy", "medium"]
        }
        busy={startingRound}
        disabled={Boolean(activeRound)}
        errorMessage={roundError}
        onStartRound={(config) => {
          setStartingRound(true);
          setRoundError(null);
          void startRound({
            sessionId: overview.session._id,
            ...config,
          })
            .catch((error: unknown) => {
              const details = getJoinErrorDetails(error);
              setRoundError(getQuizErrorMessage(details.code, details.message));
              logStartRoundFailure({
                joinCode,
                message: details.message,
              });
            })
            .finally(() => {
              setStartingRound(false);
            });
        }}
      />

      <HostQuizRoundStatus activeRound={activeRound} />

      <HostRoster
        currentRoundNumber={overview.session.currentRoundNumber}
        players={overview.roster}
      />

      {overview.encounter && overview.partySummary ? (
        <HostBattleArena
          battleRoundNumber={overview.encounter.battleRoundNumber}
          bossLineup={overview.bossLineup}
          partySummary={overview.partySummary}
        />
      ) : null}

      {overview.leaderboard.some((entry) => entry.score > 0) ? (
        <QuizPointsLeaderboard players={overview.leaderboard} />
      ) : null}
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
