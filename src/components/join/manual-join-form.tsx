import { useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import { validateJoinCode } from "./join-validation";

interface ManualJoinFormProps {
  defaultValue?: string;
  onSubmit: (joinCode: string) => void;
}

export function ManualJoinForm({
  defaultValue = "",
  onSubmit,
}: ManualJoinFormProps) {
  const [joinCode, setJoinCode] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 border-4 border-black/80 bg-[rgba(19,13,9,0.92)] p-5"
      onSubmit={(event) => {
        event.preventDefault();

        const nextError = validateJoinCode(joinCode);
        setError(nextError);
        if (nextError) {
          return;
        }

        onSubmit(joinCode.trim().toUpperCase());
      }}
    >
      <label className="block">
        <span className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Join Code
        </span>
        <input
          className="mt-3 w-full border-4 border-amber-300/50 bg-stone-950 px-4 py-3 text-lg text-stone-50 uppercase tracking-[0.32em]"
          value={joinCode}
          maxLength={6}
          onChange={(event) => {
            setJoinCode(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
      </label>
      {error ? <p className="text-rose-300 text-sm">{error}</p> : null}
      <Button font="retro" type="submit">
        Continue To Join
      </Button>
    </form>
  );
}
