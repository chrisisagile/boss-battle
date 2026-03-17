import { useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";

interface PlayerQuizQuestionProps {
  busy?: boolean;
  errorMessage?: string | null;
  onSubmit: (choiceId: string) => void;
  prompt: string;
  questionNumber: number;
  roundNumber: number;
  choices: Array<{ id: string; text: string }>;
}

export function PlayerQuizQuestion({
  busy = false,
  errorMessage = null,
  onSubmit,
  prompt,
  questionNumber,
  roundNumber,
  choices,
}: PlayerQuizQuestionProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  return (
    <Card className="w-full bg-[rgba(19,13,9,0.94)] text-stone-50">
      <CardHeader>
        <p className="text-amber-200 text-xs uppercase tracking-[0.24em]">
          Round {roundNumber} Question {questionNumber}
        </p>
        <CardTitle className="text-2xl leading-tight">{prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {choices.map((choice) => {
          const active = selectedChoiceId === choice.id;
          return (
            <label
              key={choice.id}
              className={`flex cursor-pointer items-start gap-3 border-4 px-4 py-3 transition-colors ${
                active
                  ? "border-amber-300 bg-amber-500/15"
                  : "border-black/70 bg-black/20"
              }`}
            >
              <input
                checked={active}
                className="mt-1"
                disabled={busy}
                name={`question-${questionNumber}`}
                type="radio"
                value={choice.id}
                onChange={() => setSelectedChoiceId(choice.id)}
              />
              <span className="text-base leading-6">{choice.text}</span>
            </label>
          );
        })}
        {errorMessage ? (
          <p className="text-rose-300 text-sm">{errorMessage}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          font="retro"
          type="button"
          disabled={busy || !selectedChoiceId}
          onClick={() => {
            if (selectedChoiceId) {
              onSubmit(selectedChoiceId);
            }
          }}
        >
          {busy ? "Scoring..." : "Lock Answer"}
        </Button>
      </CardFooter>
    </Card>
  );
}
