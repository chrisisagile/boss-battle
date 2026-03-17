import { v } from "convex/values";

export const JOIN_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._'!-]{1,23}$/u;
export const DEVICE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const joinCodeValidator = v.string();
export const displayNameValidator = v.string();
export const deviceIdValidator = v.string();

export function normalizeJoinCode(joinCode: string) {
  return joinCode.trim().toUpperCase();
}

export function isValidJoinCode(joinCode: string) {
  return JOIN_CODE_PATTERN.test(normalizeJoinCode(joinCode));
}

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

export function normalizeDisplayNameKey(displayName: string) {
  return normalizeDisplayName(displayName).toLocaleLowerCase();
}

export function isValidDisplayName(displayName: string) {
  const normalized = normalizeDisplayName(displayName);
  return DISPLAY_NAME_PATTERN.test(normalized);
}

export function isValidDeviceId(deviceId: string) {
  return DEVICE_ID_PATTERN.test(deviceId.trim());
}
