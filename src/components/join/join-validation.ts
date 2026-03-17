const joinCodePattern = /^[A-HJ-NP-Z2-9]{6}$/;

export function normalizeJoinCode(joinCode: string) {
  return joinCode.trim().toUpperCase();
}

export function validateJoinCode(joinCode: string) {
  const normalized = normalizeJoinCode(joinCode);
  if (!joinCodePattern.test(normalized)) {
    return "Enter a valid six-character join code.";
  }

  return null;
}

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(displayName: string) {
  const normalized = normalizeDisplayName(displayName);

  if (normalized.length < 2 || normalized.length > 24) {
    return "Enter a display name between 2 and 24 characters.";
  }

  return null;
}
