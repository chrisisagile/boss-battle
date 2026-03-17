export const activeSessionFixture = {
  sessionId: "session_active",
  joinCode: "BATTLE",
  status: "lobby",
  joinStatus: "open",
  currentRoundNumber: 0,
  participationWindowStatus: "idle",
} as const;

export const inProgressSessionFixture = {
  sessionId: "session_progress",
  joinCode: "LATE99",
  status: "in_progress",
  joinStatus: "open",
  currentRoundNumber: 3,
  participationWindowStatus: "open",
} as const;

export const activeEncounterFixture = {
  _id: "encounter_1",
  status: "active",
  encounterNumber: 1,
  battleRoundNumber: 2,
  partyMaxHealth: 30,
  partyCurrentHealth: 22,
  activeBossCount: 2,
  startedAt: 1,
  endedAt: null,
  lastResolvedAt: 2,
} as const;

export const battlePartySummaryFixture = {
  maxHealth: 30,
  currentHealth: 22,
  activePlayers: 1,
  knockedOutPlayers: 1,
} as const;

export const bossCombatantFixture = {
  id: "boss_state_1",
  displayName: "Obsidian Hydra",
  currentHealth: 18,
  maxHealth: 24,
  currentActionPoints: 3,
  actionPointsPerRound: 3,
  state: "active",
  spriteRef: null,
  fallbackSpriteKey: "boss-hydra",
} as const;

export const playerCombatantFixture = {
  id: "combatant_player_1",
  displayName: "Ari",
  currentHealth: 7,
  maxHealth: 10,
  currentActionPoints: 2,
  actionPointsPerRound: 3,
  state: "active",
  spriteRef: null,
  fallbackSpriteKey: "player-ari",
  nextQuizAdvantage: null,
  availableSkills: [
    {
      id: "skill_attack",
      name: "Slash",
      category: "attack",
      actionPointCost: 1,
      available: true,
    },
    {
      id: "skill_study",
      name: "Study Weakness",
      category: "study",
      actionPointCost: 2,
      available: true,
    },
  ],
} as const;

export const hostOverviewFixture = {
  session: {
    _id: "session_active",
    joinCode: "BATTLE",
    status: "lobby",
    joinStatus: "open",
    currentRoundNumber: 0,
    participationWindowStatus: "idle",
    activeRoundId: null,
    activeEncounterId: "encounter_1",
    battleJoinStatus: "active_battle",
    createdAt: 1,
    updatedAt: 1,
    closedAt: null,
    completedAt: null,
  },
  joinCredential: {
    joinCode: "BATTLE",
    joinUrl: "/join/BATTLE",
    qrValue: "/join/BATTLE",
    isJoinable: true,
  },
  joinedPlayerCount: 2,
  lateJoinerCount: 0,
  activeRound: null,
  encounter: activeEncounterFixture,
  partySummary: battlePartySummaryFixture,
  bossLineup: [bossCombatantFixture],
  battleJoinStatus: "active_battle",
  leaderboard: [],
  roster: [
    {
      _id: "player_1",
      displayName: "Ari",
      eligibleFromRoundNumber: 0,
      joinStatus: "joined",
      tokenBalance: 0,
      earnedPoints: 0,
    },
    {
      _id: "player_2",
      displayName: "Jules",
      eligibleFromRoundNumber: 0,
      joinStatus: "joined",
      tokenBalance: 0,
      earnedPoints: 0,
    },
  ],
} as const;
