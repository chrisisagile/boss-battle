export function createActiveSessionFixture() {
  const now = Date.now();

  return {
    joinCode: "BATTLE",
    status: "lobby",
    joinStatus: "open",
    currentRoundNumber: 0,
    participationWindowStatus: "idle",
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    completedAt: null,
  } as const;
}

export function createInProgressSessionFixture() {
  const now = Date.now();

  return {
    joinCode: "LATE99",
    status: "in_progress",
    joinStatus: "open",
    currentRoundNumber: 3,
    participationWindowStatus: "open",
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    completedAt: null,
  } as const;
}
