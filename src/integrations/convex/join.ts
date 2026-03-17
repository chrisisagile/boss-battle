import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";

export const JOIN_ERROR_CODES = {
  activeSessionExists: "active_session_exists",
  invalidJoinCode: "invalid_join_code",
  invalidDisplayName: "invalid_display_name",
  invalidDeviceId: "invalid_device_id",
  sessionNotFound: "session_not_found",
  sessionClosed: "session_closed",
  sessionCompleted: "session_completed",
  duplicateDisplayName: "duplicate_display_name",
  deviceAlreadyJoined: "device_already_joined",
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
