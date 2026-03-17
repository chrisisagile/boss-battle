import { useMemo, useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";

interface QuizAssignmentQuestion {
  assignmentId: string;
  choices: Array<{ id: string; text: string }>;
  prompt: string;
  questionNumber: number;
}

interface PlayerQuizQuestionProps {
  busy?: boolean;
  errorMessage?: string | null;
  onSubmit: (
    answers: Array<{ assignmentId: string; submittedChoiceId: string }>,
  ) => void;
  questions: QuizAssignmentQuestion[];
  roundNumber: number;
}

export function PlayerQuizQuestion({
  busy = false,
  errorMessage = null,
  onSubmit,
  questions,
  roundNumber,
}: PlayerQuizQuestionProps) {
  const [selectedChoices, setSelectedChoices] = useState<
    Record<string, string>
  >({});
  const allAnswered = useMemo(
    () =>
      questions.every((question) =>
        Boolean(selectedChoices[question.assignmentId]),
      ),
    [questions, selectedChoices],
  );

  return (
    <Card className="w-full bg-[rgba(19,13,9,0.94)] text-stone-50">
      <CardHeader>
        <p className="text-amber-200 text-xs uppercase tracking-[0.24em]">
          Round {roundNumber} Quiz
        </p>
        <CardTitle className="text-2xl leading-tight">
          Answer all {questions.length} questions before locking your sheet.
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question) => (
          <section
            key={question.assignmentId}
            className="space-y-3 border-4 border-black/70 bg-black/20 px-4 py-4"
          >
            <p className="text-amber-200 text-xs uppercase tracking-[0.24em]">
              Question {question.questionNumber}
            </p>
            <h3 className="font-bold text-xl leading-tight">
              {question.prompt}
            </h3>
            <div className="space-y-3">
              {question.choices.map((choice) => {
                const active =
                  selectedChoices[question.assignmentId] === choice.id;
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
                      name={`question-${question.questionNumber}`}
                      type="radio"
                      value={choice.id}
                      onChange={() => {
                        setSelectedChoices((current) => ({
                          ...current,
                          [question.assignmentId]: choice.id,
                        }));
                      }}
                    />
                    <span className="text-base leading-6">{choice.text}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {errorMessage ? (
          <p className="text-rose-300 text-sm">{errorMessage}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          font="retro"
          type="button"
          disabled={busy || !allAnswered}
          onClick={() =>
            onSubmit(
              questions.map((question) => ({
                assignmentId: question.assignmentId,
                submittedChoiceId: selectedChoices[question.assignmentId] ?? "",
              })),
            )
          }
        >
          {busy ? "Scoring..." : "Lock Answers"}
        </Button>
      </CardFooter>
    </Card>
  );
}
