-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."DrawRule" AS ENUM ('DRAW_ALLOWED', 'DRAW_NOT_ALLOWED', 'PENALTY_DECIDES');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('WAITING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'BYE');

-- CreateEnum
CREATE TYPE "public"."ParticipantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ELIMINATED', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."ResultType" AS ENUM ('NORMAL', 'DRAW', 'WALKOVER', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'ORGANIZER');

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "player1Id" INTEGER,
    "player2Id" INTEGER,
    "winnerId" INTEGER,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "resultType" "public"."ResultType",
    "player1PenaltyScore" INTEGER,
    "player2PenaltyScore" INTEGER,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'WAITING',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatchResult" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "registrationId" INTEGER,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "club" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "public"."ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Registration" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "club" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "public"."TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "organizerId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "registrationOpen" TIMESTAMP(3) NOT NULL,
    "registrationClose" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL,
    "drawRule" "public"."DrawRule" NOT NULL DEFAULT 'DRAW_NOT_ALLOWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "needsContact" BOOLEAN NOT NULL DEFAULT false,
    "championId" INTEGER,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentHistory" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_roundId_position_key" ON "public"."Match"("roundId" ASC, "position" ASC);

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "public"."Match"("tournamentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_matchId_key" ON "public"."MatchResult"("matchId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_registrationId_key" ON "public"."Participant"("registrationId" ASC);

-- CreateIndex
CREATE INDEX "Participant_tournamentId_idx" ON "public"."Participant"("tournamentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_roundNumber_key" ON "public"."Round"("tournamentId" ASC, "roundNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "public"."Tournament"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "public"."Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchResult" ADD CONSTRAINT "MatchResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round" ADD CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_championId_fkey" FOREIGN KEY ("championId") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentHistory" ADD CONSTRAINT "TournamentHistory_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

