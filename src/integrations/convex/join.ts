import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";

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
  invalidBattleConfig: "invalid_battle_config",
  insufficientQuestions: "insufficient_questions",
  noActiveRound: "no_active_round",
  noActiveEncounter: "no_active_encounter",
  noAssignment: "no_assignment",
  assignmentExpired: "assignment_expired",
  duplicateAnswerSubmission: "duplicate_answer_submission",
  invalidAnswerChoice: "invalid_answer_choice",
  invalidBattleAction: "invalid_battle_action",
  insufficientActionPoints: "insufficient_action_points",
  battleJoinBlocked: "battle_join_blocked",
} as const;

export type JoinErrorCode =
  (typeof JOIN_ERROR_CODES)[keyof typeof JOIN_ERROR_CODES];

interface ConvexJoinErrorData {
  code: JoinErrorCode;
  message: string;
}

interface HostSessionLoadLogContext {
  joinCode: string;
  reason: "unavailable";
}

interface JoinStatusFailureLogContext {
  joinCode: string;
  nextJoinStatus: "open" | "closed";
  message: string;
}

interface JoinSubmissionFailureLogContext {
  joinCode: string;
  message: string;
}

interface QuizAnswerFailureLogContext {
  joinCode: string;
  message: string;
}

interface BattleActionFailureLogContext {
  joinCode: string;
  message: string;
}

interface StartEncounterFailureLogContext {
  joinCode: string;
  message: string;
}

interface EncounterTransitionLogContext {
  encounterId: string | null;
  joinCode: string;
  nextState: string;
  previousState: string;
  role: "host" | "player";
}

export function getJoinErrorDetails(error: unknown) {
  if (error instanceof ConvexError) {
    const data = error.data as ConvexJoinErrorData | undefined;
    return {
      code: data?.code ?? null,
      message: data?.message ?? error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: null,
      message: error.message,
    };
  }

  return {
    code: null,
    message: "Something went wrong while updating the session.",
  };
}

export function useCurrentActiveSession() {
  return useQuery(api.gameSessions.getCurrentActive, {});
}

export function useHostOverview(joinCode: string) {
  return useQuery(
    api.gameSessions.getHostOverview,
    joinCode ? { joinCode } : "skip",
  );
}

export function useJoinableSession(joinCode: string) {
  return useQuery(
    api.gameSessions.resolveJoinableSession,
    joinCode ? { joinCode } : "skip",
  );
}

export function useCreateSessionMutation() {
  return useMutation(api.gameSessions.create);
}

export function useSetJoinStatusMutation() {
  return useMutation(api.gameSessions.setJoinStatus);
}

export function useJoinSessionMutation() {
  return useMutation(api.playerEntries.join);
}

export function useQuestionBankSummary() {
  return useQuery(api.quizQuestions.getQuestionBankSummary, {});
}

export function useSyncQuestionBankMutation() {
  return useMutation(api.quizQuestionLoader.syncQuestionBank);
}

export function usePlayerQuizState(joinCode: string, deviceId: string) {
  return useQuery(
    api.quizRounds.getPlayerQuizState,
    joinCode && deviceId ? { joinCode, deviceId } : "skip",
  );
}

export function useBossCatalog() {
  return useQuery(api.battleState.listBossCatalog, {});
}

export function useStartEncounterMutation() {
  return useMutation(api.battleState.startEncounter);
}

export function useSubmitBattleActionMutation() {
  return useMutation(api.battleState.submitPlayerAction);
}

export function useResolveBattleExchangeMutation() {
  return useMutation(api.battleState.resolveBattleExchange);
}

export function useEndGameMutation() {
  return useMutation(api.gameSessions.endGame);
}

export function useSubmitQuizAnswerMutation() {
  return useMutation(api.quizAssignments.submitAnswer);
}

export function useSubmitQuizAnswerBatchMutation() {
  return useMutation(api.quizAssignments.submitAnswerBatch);
}

export function logHostSessionLoadIssue(context: HostSessionLoadLogContext) {
  console.error("Host session overview is unavailable.", {
    action: "host_session_load",
    ...context,
  });
}

export function logJoinStatusFailure(context: JoinStatusFailureLogContext) {
  console.error("Failed to update host join status.", {
    action: "set_join_status",
    ...context,
  });
}

export function logJoinSubmissionFailure(
  context: JoinSubmissionFailureLogContext,
) {
  console.error("Failed to join session.", {
    action: "join_session",
    ...context,
  });
}

export function logQuizAnswerFailure(context: QuizAnswerFailureLogContext) {
  console.error("Failed to submit quiz answer.", {
    action: "submit_quiz_answer",
    ...context,
  });
}

export function logBattleActionFailure(context: BattleActionFailureLogContext) {
  console.error("Failed to submit battle action.", {
    action: "submit_battle_action",
    ...context,
  });
}

export function logStartEncounterFailure(
  context: StartEncounterFailureLogContext,
) {
  console.error("Failed to start battle encounter.", {
    action: "start_battle_encounter",
    ...context,
  });
}

export function logEncounterTransition(context: EncounterTransitionLogContext) {
  console.info("Battle encounter state changed.", {
    action: "battle_encounter_transition",
    ...context,
  });
}
