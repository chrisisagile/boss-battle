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

export function createBossDefinitionFixture() {
  const now = Date.now();

  return {
    name: "Obsidian Hydra",
    description: "A many-headed boss that grows more dangerous with the room.",
    baseHealth: 24,
    baseActionPointsPerRound: 2,
    scalingProfile: {
      healthPerPlayer: 3,
      actionPointsPerPlayerThreshold: 4,
      bonusActionPoints: 1,
    },
    skillIds: [],
    defaultSpriteRef: null,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  } as const;
}

export function createBattleEncounterFixture() {
  const now = Date.now();

  return {
    status: "active",
    encounterNumber: 1,
    battleRoundNumber: 1,
    partyMaxHealth: 30,
    partyCurrentHealth: 26,
    activeBossCount: 1,
    startedAt: now,
    endedAt: null,
    lastResolvedAt: now,
  } as const;
}
