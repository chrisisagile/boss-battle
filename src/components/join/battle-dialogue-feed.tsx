import { Badge } from "@/components/ui/8bit/badge";
import { Separator } from "@/components/ui/8bit/separator";
import type {
  BattleActivityActorType as BattleDialogueActorType,
  BattleActivityEvent as BattleDialogueEvent,
  BattleActivityOutcomeType as BattleDialogueOutcomeType,
} from "@/integrations/convex/join";
import { cn } from "@/lib/utils";

export type {
  BattleDialogueActorType,
  BattleDialogueEvent,
  BattleDialogueOutcomeType,
};

export interface BattleDialogueFeedData {
  currentEvent?: BattleDialogueEvent | null;
  recentEvents?: readonly BattleDialogueEvent[];
}

export interface BattleDialogueFeedProps extends BattleDialogueFeedData {
  className?: string;
  emptyMessage?: string;
  historyLabel?: string;
  title?: string;
}

export function BattleDialogueFeed({
  className,
  currentEvent = null,
  emptyMessage = "Waiting for battle activity.",
  historyLabel = "Recent history",
  recentEvents = [],
  title = "Battle Dialogue",
}: BattleDialogueFeedProps) {
  const historyEvents = currentEvent
    ? recentEvents.filter(
        (event) => event.eventNumber !== currentEvent.eventNumber,
      )
    : recentEvents;

  return (
    <section
      aria-label={title}
      className={cn(
        "border-4 border-black/80 bg-[rgba(19,13,9,0.95)] p-5 text-stone-50 shadow-[8px_8px_0_0_rgba(18,12,8,0.45)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
            Battle Feed
          </p>
          <h3 className="mt-1 font-black text-xl">{title}</h3>
        </div>
        {currentEvent ? (
          <Badge
            font="retro"
            className="border-amber-200 bg-amber-200 text-stone-950"
          >
            Current Event #{currentEvent.eventNumber}
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {currentEvent ? (
          <BattleDialogueEntry
            event={currentEvent}
            heading="Current action"
            variant="current"
          />
        ) : (
          <p className="text-sm text-stone-300">{emptyMessage}</p>
        )}

        {historyEvents.length > 0 ? (
          <>
            <Separator className="opacity-70" />
            <div className="space-y-3">
              <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
                {historyLabel}
              </p>
              <ol className="space-y-3">
                {historyEvents.map((event) => (
                  <li key={event.eventNumber}>
                    <BattleDialogueEntry
                      event={event}
                      heading={`Event #${event.eventNumber}`}
                      variant="history"
                    />
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

interface BattleDialogueEntryProps {
  event: BattleDialogueEvent;
  heading: string;
  variant: "current" | "history";
}

function BattleDialogueEntry({
  event,
  heading,
  variant,
}: BattleDialogueEntryProps) {
  return (
    <article
      className={cn(
        "border-4 border-black/70 bg-black/20 p-4",
        variant === "current" && "bg-amber-950/35",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="retro text-[10px] text-stone-300 uppercase tracking-[0.2em]">
          {heading}
        </p>
        <span className="retro text-[10px] text-stone-300">
          {formatActorType(event.actorType)}
        </span>
      </div>

      <p className="mt-3 font-bold text-sm text-stone-50 leading-6">
        {event.actorName} used {event.actionLabel}
        {event.targetName ? ` on ${event.targetName}` : " with no target"}.
      </p>

      <p className="mt-1 text-sm text-stone-200 leading-6">
        Outcome: {formatOutcomeLabel(event.outcomeType)}
        {event.magnitude != null ? `, ${formatMagnitude(event)}` : ""}
        {event.resultingTargetHealth != null
          ? `, target at ${event.resultingTargetHealth} HP`
          : ""}
        {event.resultingTargetState
          ? `, target state ${formatStateLabel(event.resultingTargetState)}`
          : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="retro border-2 border-black/70 bg-stone-950 px-2 py-1 text-[10px] text-stone-100 uppercase tracking-[0.18em]">
          Actor: {formatActorType(event.actorType)}
        </span>
        <span className="retro border-2 border-black/70 bg-stone-950 px-2 py-1 text-[10px] text-stone-100 uppercase tracking-[0.18em]">
          Target: {event.targetName ?? "None"}
        </span>
        <span
          className={cn(
            "retro border-2 border-black/70 px-2 py-1 text-[10px] text-stone-100 uppercase tracking-[0.18em]",
            getOutcomeChipClasses(event.outcomeType),
          )}
        >
          {formatOutcomeLabel(event.outcomeType)}
        </span>
      </div>

      {event.summaryText ? (
        <p className="mt-3 text-amber-100 text-sm leading-6">
          {event.summaryText}
        </p>
      ) : null}
    </article>
  );
}

function formatActorType(actorType: BattleDialogueActorType) {
  return actorType === "boss" ? "Boss" : "Player";
}

function formatOutcomeLabel(outcomeType: BattleDialogueOutcomeType) {
  return outcomeType.charAt(0).toUpperCase() + outcomeType.slice(1);
}

function formatStateLabel(state: string) {
  return state
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMagnitude(event: BattleDialogueEvent) {
  switch (event.outcomeType) {
    case "damage":
      return `${event.magnitude} damage`;
    case "heal":
      return `${event.magnitude} health restored`;
    case "guard":
      return `${event.magnitude} blocked`;
    default:
      return `${event.magnitude}`;
  }
}

function getOutcomeChipClasses(outcomeType: BattleDialogueOutcomeType) {
  switch (outcomeType) {
    case "damage":
      return "bg-rose-950 border-rose-300";
    case "heal":
      return "bg-emerald-950 border-emerald-300";
    case "guard":
      return "bg-sky-950 border-sky-300";
    case "miss":
      return "bg-stone-900 border-stone-300";
    case "skipped":
      return "bg-amber-950 border-amber-200";
    case "knockout":
      return "bg-fuchsia-950 border-fuchsia-300";
    case "status":
      return "bg-violet-950 border-violet-300";
    default:
      return "bg-stone-900 border-stone-300";
  }
}
