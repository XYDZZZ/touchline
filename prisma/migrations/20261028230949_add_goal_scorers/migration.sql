-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamLogoUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "score1" INTEGER,
    "score2" INTEGER,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "matchDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalScorer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalScorer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalMatchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchDate" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "myTeamId" TEXT NOT NULL,
    "myTeamName" TEXT NOT NULL,
    "myTeamLogoUrl" TEXT NOT NULL,
    "opponentTeamId" TEXT NOT NULL,
    "opponentTeamName" TEXT NOT NULL,
    "opponentTeamLogoUrl" TEXT NOT NULL,
    "formation" TEXT,
    "playstyle" TEXT,
    "result" TEXT NOT NULL,
    "myGoals" INTEGER NOT NULL,
    "opponentGoals" INTEGER NOT NULL,
    "evaluation" TEXT,
    "gameTitle" TEXT NOT NULL DEFAULT 'eFootball',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalMatchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tournamentId_playerName_key" ON "Participant"("tournamentId", "playerName");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_tournamentId_round_slot_key" ON "TournamentMatch"("tournamentId", "round", "slot");

-- CreateIndex
CREATE INDEX "GoalScorer_tournamentId_idx" ON "GoalScorer"("tournamentId");

-- CreateIndex
CREATE INDEX "GoalScorer_matchId_idx" ON "GoalScorer"("matchId");

-- CreateIndex
CREATE INDEX "PersonalMatchLog_userId_matchDate_idx" ON "PersonalMatchLog"("userId", "matchDate");
