import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";

interface PlayerQuizResultProps {
  awardedTokens: number;
  evaluationResult: "correct" | "incorrect";
  tokenBalance: number;
}

export function PlayerQuizResult({
  awardedTokens,
  evaluationResult,
  tokenBalance,
}: PlayerQuizResultProps) {
  const correct = evaluationResult === "correct";

  return (
    <Card className="w-full bg-[rgba(19,13,9,0.94)] text-stone-50">
      <CardHeader>
        <p className="text-amber-200 text-xs uppercase tracking-[0.24em]">
          Answer Locked
        </p>
        <CardTitle className="text-2xl">
          {correct ? "Correct answer." : "Not this time."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-base text-stone-200 leading-7">
        <p>
          {correct
            ? `You earned ${awardedTokens} action token${awardedTokens === 1 ? "" : "s"}.`
            : "No action tokens were awarded for that answer."}
        </p>
        <p>Current token balance: {tokenBalance}</p>
      </CardContent>
    </Card>
  );
}
