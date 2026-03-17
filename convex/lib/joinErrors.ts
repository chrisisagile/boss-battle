import { ConvexError } from "convex/values";

export const JOIN_ERROR_CODES = {
  activeSessionExists: "active_session_exists",
  invalidJoinCode: "invalid_join_code",
  invalidDisplayName: "invalid_display_name",
  invalidDeviceId: "invalid_device_id",
  invalidQuestionBankEntry: "invalid_question_bank_entry",
  sessionNotFound: "session_not_found",
  sessionClosed: "session_closed",
  sessionCompleted: "session_completed",
  duplicateDisplayName: "duplicate_display_name",
  deviceAlreadyJoined: "device_already_joined",
  invalidRoundConfig: "invalid_round_config",
  insufficientQuestions: "insufficient_questions",
  noActiveRound: "no_active_round",
  noAssignment: "no_assignment",
  assignmentExpired: "assignment_expired",
  duplicateAnswerSubmission: "duplicate_answer_submission",
  invalidAnswerChoice: "invalid_answer_choice",
} as const;

export type JoinErrorCode =
  (typeof JOIN_ERROR_CODES)[keyof typeof JOIN_ERROR_CODES];

export interface JoinErrorData {
  code: JoinErrorCode;
  message: string;
}

export function createJoinError(code: JoinErrorCode, message: string): never {
  throw new ConvexError({
    code,
    message,
  });
}
