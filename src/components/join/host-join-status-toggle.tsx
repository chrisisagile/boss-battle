import { Button } from "@/components/ui/8bit/button";

interface HostJoinStatusToggleProps {
  disabled?: boolean;
  joinStatus: "open" | "closed";
  onToggle: () => void;
}

export function HostJoinStatusToggle({
  disabled = false,
  joinStatus,
  onToggle,
}: HostJoinStatusToggleProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-4 border-black/80 bg-[rgba(18,12,8,0.72)] px-4 py-4">
      <div>
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Join Status
        </p>
        <p className="mt-2 text-sm text-stone-200 leading-6">
          {joinStatus === "open"
            ? "Late arrivals can still jump in."
            : "New join attempts will be rejected until you reopen the session."}
        </p>
      </div>
      <Button
        font="retro"
        type="button"
        variant={joinStatus === "open" ? "secondary" : "default"}
        disabled={disabled}
        onClick={onToggle}
      >
        {joinStatus === "open" ? "Close Joining" : "Reopen Joining"}
      </Button>
    </div>
  );
}
