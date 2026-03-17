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

export const hostOverviewFixture = {
  session: {
    _id: "session_active",
    joinCode: "BATTLE",
    status: "lobby",
    joinStatus: "open",
    currentRoundNumber: 0,
    participationWindowStatus: "idle",
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
  roster: [
    {
      _id: "player_1",
      displayName: "Ari",
      eligibleFromRoundNumber: 0,
      joinStatus: "joined",
    },
    {
      _id: "player_2",
      displayName: "Jules",
      eligibleFromRoundNumber: 0,
      joinStatus: "joined",
    },
  ],
} as const;
