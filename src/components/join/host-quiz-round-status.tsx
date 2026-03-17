interface HostQuizRoundStatusProps {
  activeRound: {
    allowedCategories: string[];
    allowedComplexities: string[];
    questionTarget: number;
    questionsCompleted: number;
    remainingQuestions: number;
    roundNumber: number;
    status: string;
  } | null;
}

export function HostQuizRoundStatus({ activeRound }: HostQuizRoundStatusProps) {
  if (!activeRound) {
    return (
      <section className="border-4 border-black/80 bg-[rgba(18,12,8,0.72)] px-4 py-4 text-stone-50">
        <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
          Round Status
        </p>
        <p className="mt-3 text-sm text-stone-200 leading-6">
          No quiz round is active. Configure the next round when the room is
          ready.
        </p>
      </section>
    );
  }

  return (
    <section className="border-4 border-black/80 bg-[rgba(18,12,8,0.72)] px-4 py-4 text-stone-50">
      <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
        Round {activeRound.roundNumber}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <p className="text-sm text-stone-200 leading-6">
          {activeRound.questionsCompleted} of {activeRound.questionTarget}{" "}
          question
          {activeRound.questionTarget === 1 ? "" : "s"} completed.{" "}
          {activeRound.remainingQuestions} remaining.
        </p>
        <p className="text-sm text-stone-200 leading-6">
          Categories: {activeRound.allowedCategories.join(", ")}. Difficulty:{" "}
          {activeRound.allowedComplexities.join(", ")}.
        </p>
      </div>
    </section>
  );
}
