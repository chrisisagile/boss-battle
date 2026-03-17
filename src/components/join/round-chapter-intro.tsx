import { Button } from "@/components/ui/8bit/button";
import { ChapterIntro } from "@/components/ui/8bit/chapter-intro";

interface RoundChapterIntroProps {
  description: string;
  onContinue?: () => void;
  questionTarget: number;
  roundNumber: number;
}

export function RoundChapterIntro({
  description,
  onContinue,
  questionTarget,
  roundNumber,
}: RoundChapterIntroProps) {
  return (
    <ChapterIntro
      kicker="Round Start"
      title={`Round ${roundNumber} begins now.`}
      description={`${description} This round runs for ${questionTarget} question${questionTarget === 1 ? "" : "s"}.`}
    >
      {onContinue ? (
        <Button font="retro" type="button" onClick={onContinue}>
          Enter Quiz
        </Button>
      ) : null}
    </ChapterIntro>
  );
}
