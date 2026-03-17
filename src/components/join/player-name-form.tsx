import { useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import { validateDisplayName } from "./join-validation";

interface PlayerNameFormProps {
  busy?: boolean;
  errorMessage?: string | null;
  onSubmit: (displayName: string) => void;
}

export function PlayerNameForm({
  busy = false,
  errorMessage = null,
  onSubmit,
}: PlayerNameFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 border-4 border-black/80 bg-[rgba(19,13,9,0.92)] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const nextError = validateDisplayName(displayName);
        setLocalError(nextError);
        if (nextError) {
          return;
        }

        onSubmit(displayName.trim());
      }}
    >
      <div>
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Join Battle
        </p>
        <p className="mt-2 text-sm text-stone-300 leading-6">
          Pick the name the host will see on the live roster.
        </p>
      </div>
      <label className="block">
        <span className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Display Name
        </span>
        <input
          className="mt-3 w-full border-4 border-amber-300/50 bg-stone-950 px-4 py-3 text-lg text-stone-50"
          value={displayName}
          maxLength={24}
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
        />
      </label>
      {localError ? (
        <p className="text-rose-300 text-sm">{localError}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-rose-300 text-sm">{errorMessage}</p>
      ) : null}
      <Button font="retro" type="submit" disabled={busy}>
        {busy ? "Joining..." : "Join Battle"}
      </Button>
    </form>
  );
}
