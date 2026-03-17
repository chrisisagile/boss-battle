import { useMemo, useState } from "react";
import { Button } from "@/components/ui/8bit/button";

interface HostQuizRoundControlsProps {
  availableCategories: string[];
  availableComplexities: string[];
  busy?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
  onStartRound: (config: {
    allowedCategories: string[];
    allowedComplexities: string[];
    questionTarget: number;
  }) => void;
}

export function HostQuizRoundControls({
  availableCategories,
  availableComplexities,
  busy = false,
  disabled = false,
  errorMessage = null,
  onStartRound,
}: HostQuizRoundControlsProps) {
  const [questionTarget, setQuestionTarget] = useState("3");
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(availableCategories);
  const [selectedComplexities, setSelectedComplexities] = useState<string[]>(
    availableComplexities,
  );

  const formDisabled = disabled || busy;
  const canStart = useMemo(
    () =>
      !formDisabled &&
      selectedCategories.length > 0 &&
      selectedComplexities.length > 0 &&
      Number(questionTarget) > 0,
    [formDisabled, questionTarget, selectedCategories, selectedComplexities],
  );

  function toggleValue(
    value: string,
    selectedValues: string[],
    setSelectedValues: (values: string[]) => void,
  ) {
    setSelectedValues(
      selectedValues.includes(value)
        ? selectedValues.filter((entry) => entry !== value)
        : [...selectedValues, value],
    );
  }

  return (
    <section className="space-y-4 border-4 border-black/80 bg-[rgba(18,12,8,0.72)] px-4 py-4 text-stone-50">
      <div>
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Quiz Round Controls
        </p>
        <p className="mt-2 text-sm text-stone-200 leading-6">
          Configure how many questions the room will answer and which quiz
          categories and difficulties are allowed in this round.
        </p>
      </div>

      <label className="block">
        <span className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Questions This Round
        </span>
        <input
          className="mt-3 w-full border-4 border-amber-300/50 bg-stone-950 px-4 py-3 text-lg text-stone-50"
          disabled={formDisabled}
          inputMode="numeric"
          min="1"
          type="number"
          value={questionTarget}
          onChange={(event) => setQuestionTarget(event.target.value)}
        />
      </label>

      <div className="space-y-3">
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Categories
        </p>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <Button
              key={category}
              font="retro"
              type="button"
              disabled={formDisabled}
              variant={
                selectedCategories.includes(category) ? "default" : "secondary"
              }
              onClick={() =>
                toggleValue(category, selectedCategories, setSelectedCategories)
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Difficulty
        </p>
        <div className="flex flex-wrap gap-2">
          {availableComplexities.map((complexity) => (
            <Button
              key={complexity}
              font="retro"
              type="button"
              disabled={formDisabled}
              variant={
                selectedComplexities.includes(complexity)
                  ? "default"
                  : "secondary"
              }
              onClick={() =>
                toggleValue(
                  complexity,
                  selectedComplexities,
                  setSelectedComplexities,
                )
              }
            >
              {complexity}
            </Button>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p className="text-rose-300 text-sm">{errorMessage}</p>
      ) : null}

      <div className="flex justify-end">
        <Button
          font="retro"
          type="button"
          disabled={!canStart}
          onClick={() =>
            onStartRound({
              questionTarget: Number(questionTarget),
              allowedCategories: selectedCategories,
              allowedComplexities: selectedComplexities,
            })
          }
        >
          {busy ? "Starting..." : "Start Quiz Round"}
        </Button>
      </div>
    </section>
  );
}
