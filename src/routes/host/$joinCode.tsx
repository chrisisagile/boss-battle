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
import { RoundChapterIntro } from "@/components/join/round-chapter-intro";
import { Button } from "@/components/ui/8bit/button";
import {
  getJoinErrorDetails,
  logEncounterTransition,
  logHostSessionLoadIssue,
  logJoinStatusFailure,
  logStartEncounterFailure,
  useBossCatalog,
  useHostOverview,
  useQuestionBankSummary,
  useResolveBattleExchangeMutation,
  useSetJoinStatusMutation,
  useStartEncounterMutation,
} from "@/integrations/convex/join";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/host/$joinCode")({
  component: HostRouteComponent,
});

interface LobbyConfigState {
  allowedCategories: string[];
  allowedComplexities: string[];
  questionTarget: number;
}

export function HostSessionPage({ joinCode }: { joinCode: string }) {
  const overview = useHostOverview(joinCode);
  const bossCatalog = useBossCatalog();
  const questionBankSummary = useQuestionBankSummary();
  const setJoinStatus = useSetJoinStatusMutation();
  const resolveBattleExchange = useResolveBattleExchangeMutation();
  const startEncounter = useStartEncounterMutation();
  const [battleError, setBattleError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [introRoundNumber, setIntroRoundNumber] = useState<number | null>(null);
  const [config, setConfig] = useState<LobbyConfigState>({
    questionTarget: 3,
    allowedCategories: ["history", "science"],
    allowedComplexities: ["easy", "medium", "hard"],
  });
  const previousEncounterStateRef = useRef<string | null>(null);
  const activeRound = overview?.activeRound ?? null;
  const partyCombatants = overview?.partyCombatants ?? [];
  const inLobby =
    (overview?.gamePhase ?? "lobby") === "lobby" && !overview?.encounter;
  const canResolveBossOnlyExchange =
    Boolean(overview?.encounter) &&
    activeRound?.phase === "action_selection" &&
    partyCombatants.every(
      (combatant) =>
        combatant.state !== "active" || combatant.currentActionPoints <= 0,
    );

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/join/${joinCode}`;
    }

    return new URL(`/join/${joinCode}`, window.location.origin).toString();
  }, [joinCode]);

  useEffect(() => {
    if (questionBankSummary) {
      setConfig((current) => ({
        questionTarget: current.questionTarget,
        allowedCategories:
          current.allowedCategories.length > 0
            ? current.allowedCategories
            : questionBankSummary.availableCategories,
        allowedComplexities:
          current.allowedComplexities.length > 0
            ? current.allowedComplexities
            : questionBankSummary.availableComplexities,
      }));
    }
  }, [questionBankSummary]);

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
      ? `${overview.encounter.encounterNumber}:${overview.encounter.status}:${overview.gamePhase}`
      : overview.gamePhase;
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

      {activeRound && introRoundNumber === activeRound.roundNumber ? (
        <RoundChapterIntro
          description="The room can see the round start on the shared projector before the next question batch appears."
          questionTarget={activeRound.questionTarget}
          roundNumber={activeRound.roundNumber}
          onContinue={() => setIntroRoundNumber(null)}
        />
      ) : null}

      {inLobby ? (
        <>
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
                setErrorMessage(
                  getJoinErrorMessage(details.code, details.message),
                );
                logJoinStatusFailure({
                  joinCode,
                  nextJoinStatus,
                  message: details.message,
                });
              });
            }}
          />

          <HostQuizRoundControls
            availableCategories={
              questionBankSummary?.availableCategories ?? ["history", "science"]
            }
            availableComplexities={
              questionBankSummary?.availableComplexities ?? [
                "easy",
                "medium",
                "hard",
              ]
            }
            disabled={startingGame}
            errorMessage={battleError}
            showSubmitButton={false}
            onConfigChange={setConfig}
          />

          {bossCatalog ? (
            <HostBattleSetup
              bossCatalog={bossCatalog}
              busy={startingGame}
              errorMessage={battleError}
              onStartEncounter={(bossDefinitionIds) => {
                setStartingGame(true);
                setBattleError(null);
                void startEncounter({
                  bossDefinitionIds:
                    bossDefinitionIds as Id<"bossDefinitions">[],
                  questionTarget: config.questionTarget,
                  allowedCategories: config.allowedCategories,
                  allowedComplexities: config.allowedComplexities,
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
                    setStartingGame(false);
                  });
              }}
            />
          ) : null}
        </>
      ) : null}

      {errorMessage ? (
        <p className="border-4 border-rose-400/50 bg-rose-950/40 px-4 py-3 text-rose-200 text-sm">
          {errorMessage}
        </p>
      ) : null}

      {canResolveBossOnlyExchange && overview?.encounter && activeRound ? (
        <section className="flex items-center justify-between gap-4 border-4 border-black/80 bg-[rgba(18,12,8,0.72)] px-4 py-4 text-stone-50">
          <div>
            <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
              Exchange Ready
            </p>
            <p className="mt-2 text-sm text-stone-200 leading-6">
              No active heroes have action points left for this exchange.
              Continue to the boss resolution step.
            </p>
          </div>
          <Button
            font="retro"
            type="button"
            onClick={() => {
              setBattleError(null);
              const encounterId = overview.encounter?.id;
              if (!encounterId) {
                return;
              }

              void resolveBattleExchange({
                encounterId: encounterId as Id<"battleEncounters">,
                roundId: activeRound.id as Id<"gameRounds">,
              }).catch((error: unknown) => {
                const details = getJoinErrorDetails(error);
                setBattleError(
                  getBattleErrorMessage(details.code, details.message),
                );
              });
            }}
          >
            Continue Battle
          </Button>
        </section>
      ) : null}

      <HostQuizRoundStatus activeRound={activeRound} />

      <HostRoster
        currentRoundNumber={overview.session.currentRoundNumber}
        players={overview.roster}
      />

      {overview.encounter && overview.partySummary ? (
        <HostBattleArena
          battleRoundNumber={overview.encounter.battleRoundNumber}
          bossLineup={overview.bossLineup}
          partyCombatants={overview.partyCombatants}
          partySummary={overview.partySummary}
        />
      ) : null}

      {overview.leaderboard.some((entry) => entry.score > 0) ? (
        <QuizPointsLeaderboard players={overview.leaderboard} />
      ) : null}

      {overview.results ? (
        <HostPageState
          heading="Game Over"
          body={`Outcome: ${overview.results.completionReason}. ${overview.results.roundsCompleted} round${overview.results.roundsCompleted === 1 ? "" : "s"} completed.`}
        />
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
    <section className="border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-6 text-stone-50 shadow-[10px_10px_0_0_rgba(18,12,8,0.55)]">
      <h1 className="font-black text-3xl tracking-tight">{heading}</h1>
      <p className="mt-4 text-base text-stone-300 leading-7">{body}</p>
    </section>
  );
}
