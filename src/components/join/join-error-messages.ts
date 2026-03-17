import type { JoinErrorCode } from "@/integrations/convex/join";
import { JOIN_ERROR_CODES } from "@/integrations/convex/join";

export function getJoinErrorMessage(
  code: JoinErrorCode | null,
  fallback: string,
) {
  switch (code) {
    case JOIN_ERROR_CODES.activeSessionExists:
      return "There is already an active session on this host.";
    case JOIN_ERROR_CODES.invalidJoinCode:
      return "Enter a valid six-character join code.";
    case JOIN_ERROR_CODES.invalidDisplayName:
      return "Enter a display name between 2 and 24 characters.";
    case JOIN_ERROR_CODES.invalidDeviceId:
      return "This device could not be identified. Refresh and try again.";
    case JOIN_ERROR_CODES.sessionNotFound:
      return "That session is unavailable. Check the code and try again.";
    case JOIN_ERROR_CODES.sessionClosed:
      return "Joining is closed for this session.";
    case JOIN_ERROR_CODES.sessionCompleted:
      return "That session has already ended.";
    case JOIN_ERROR_CODES.duplicateDisplayName:
      return "That display name is already taken in this session.";
    case JOIN_ERROR_CODES.deviceAlreadyJoined:
      return "This device is already attached to the session.";
    default:
      return fallback;
  }
}
