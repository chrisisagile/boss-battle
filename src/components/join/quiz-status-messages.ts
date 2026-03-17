import type { JoinErrorCode } from "@/integrations/convex/join";
import { JOIN_ERROR_CODES } from "@/integrations/convex/join";

export function getQuizErrorMessage(
  code: JoinErrorCode | null,
  fallback: string,
) {
  switch (code) {
    case JOIN_ERROR_CODES.invalidRoundConfig:
      return "Choose a valid round size, category, and difficulty before starting.";
    case JOIN_ERROR_CODES.insufficientQuestions:
      return "Those quiz rules do not have enough unique questions for everyone in the room.";
    case JOIN_ERROR_CODES.noActiveRound:
      return "The next quiz round has not started yet.";
    case JOIN_ERROR_CODES.noAssignment:
      return "There is no active quiz question for this player right now.";
    case JOIN_ERROR_CODES.assignmentExpired:
      return "That question expired before it could be scored.";
    case JOIN_ERROR_CODES.duplicateAnswerSubmission:
      return "That answer has already been submitted.";
    case JOIN_ERROR_CODES.invalidAnswerChoice:
      return "Pick one of the answer choices before submitting.";
    default:
      return fallback;
  }
}
