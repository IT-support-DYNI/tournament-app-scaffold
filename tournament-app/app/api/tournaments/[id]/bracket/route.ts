import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTournament } from "@/lib/authorization";
import { notifyUser } from "@/lib/notify";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ParticipantRow = {
  id: number;
  name: string;
  userId: number | null;
};

function nextPowerOfTwo(value: number) {
  let power = 1;

  while (power < value) {
    power *= 2;
  }

  return power;
}

function shuffle<T>(array: T[]) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const tournamentId = Number(id);

    if (!Number.isInteger(tournamentId)) {
      return NextResponse.json(
        {
          error: "Invalid tournament ID.",
        },
        { status: 400 }
      );
    }

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentId,
        },
        include: {
          participants: true,
          rounds: true,
          matches: true,
        },
      });

    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    // Only the organizer or an admin can generate
    // the bracket.

    if (
      !canManageTournament(
        session.user.role,
        Number(session.user.id),
        tournament.organizerId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only the tournament organizer can generate the bracket.",
        },
        { status: 403 }
      );
    }

    // Don't allow the bracket to be generated
    // twice.

    if (tournament.rounds.length > 0) {
      return NextResponse.json(
        {
          error:
            "A bracket has already been generated for this tournament.",
        },
        { status: 400 }
      );
    }

    const participants =
      tournament.participants.filter(
        (participant) =>
          participant.status === "ACTIVE"
      );

    if (participants.length < 2) {
      return NextResponse.json(
        {
          error:
            "At least 2 active participants are required to generate a bracket.",
        },
        { status: 400 }
      );
    }

    const bracketSize = nextPowerOfTwo(
      participants.length
    );

    const numberOfRounds = Math.log2(
      bracketSize
    );

    /*
     * Shuffle participants so the initial
     * bracket isn't always ordered by ID.
     */
    const shuffledParticipants =
      shuffle(participants);

    const matchesInRound1 = bracketSize / 2;

    /*
     * byeCount is always strictly less than
     * matchesInRound1 (a consequence of
     * bracketSize being the *smallest* power of
     * two >= participants.length), so we can
     * always give each bye its own match instead
     * of letting two byes land in the same match.
     */
    const byeCount =
      bracketSize - shuffledParticipants.length;

    const matchPairs: {
      player1: ParticipantRow | null;
      player2: ParticipantRow | null;
    }[] = [];

    let participantCursor = 0;

    for (
      let matchIndex = 0;
      matchIndex < matchesInRound1;
      matchIndex++
    ) {
      if (matchIndex < byeCount) {
        matchPairs.push({
          player1:
            shuffledParticipants[
              participantCursor++
            ] ?? null,
          player2: null,
        });
      } else {
        matchPairs.push({
          player1:
            shuffledParticipants[
              participantCursor++
            ] ?? null,
          player2:
            shuffledParticipants[
              participantCursor++
            ] ?? null,
        });
      }
    }

    const result =
      await prisma.$transaction(async (tx) => {
        const rounds = [];

        /*
         * Create all rounds first.
         */
        for (
          let roundNumber = 1;
          roundNumber <= numberOfRounds;
          roundNumber++
        ) {
          const matchesInRound =
            bracketSize /
            Math.pow(2, roundNumber);

          const round = await tx.round.create({
            data: {
              tournamentId,
              roundNumber,
              name:
                roundNumber === numberOfRounds
                  ? "Final"
                  : `Round ${roundNumber}`,
            },
          });

          rounds.push({
            round,
            matchesInRound,
          });
        }

        const roundByNumber = new Map(
          rounds.map((entry) => [
            entry.round.roundNumber,
            entry.round,
          ])
        );

        const roundById = new Map(
          rounds.map((entry) => [
            entry.round.id,
            entry.round,
          ])
        );

        /*
         * Create matches.
         */
        const createdMatches = [];

        for (const roundData of rounds) {
          const {
            round,
            matchesInRound,
          } = roundData;

          for (
            let position = 1;
            position <= matchesInRound;
            position++
          ) {
            let player1Id: number | null =
              null;

            let player2Id: number | null =
              null;

            let status:
              | "WAITING"
              | "READY"
              | "BYE" =
              "WAITING";

            /*
             * Round 1 gets actual participants,
             * paired so that at most one bye
             * lands in any single match.
             */
            if (round.roundNumber === 1) {
              const pair =
                matchPairs[position - 1];

              player1Id =
                pair?.player1?.id ?? null;

              player2Id =
                pair?.player2?.id ?? null;

              if (player1Id && player2Id) {
                status = "READY";
              } else if (
                player1Id ||
                player2Id
              ) {
                status = "BYE";
              } else {
                status = "WAITING";
              }
            }

            const match =
              await tx.match.create({
                data: {
                  tournamentId,
                  roundId: round.id,
                  position,
                  player1Id,
                  player2Id,
                  status,
                },
              });

            createdMatches.push(match);

            if (
              round.roundNumber === 1 &&
              status === "READY"
            ) {
              const pair =
                matchPairs[position - 1];

              await notifyUser(
                tx,
                pair?.player1?.userId,
                `Your first match in "${tournament.name}" is ready — you're facing ${pair?.player2?.name}.`
              );

              await notifyUser(
                tx,
                pair?.player2?.userId,
                `Your first match in "${tournament.name}" is ready — you're facing ${pair?.player1?.name}.`
              );
            }
          }
        }

        /*
         * For BYE matches, the only player
         * automatically becomes the winner and
         * advances into the next round, exactly
         * like a normal match result would.
         */
        for (const match of createdMatches) {
          if (match.status !== "BYE") {
            continue;
          }

          const winnerId =
            match.player1Id ??
            match.player2Id;

          if (!winnerId) {
            continue;
          }

          await tx.match.update({
            where: {
              id: match.id,
            },
            data: {
              winnerId,
            },
          });

          const currentRound = roundById.get(
            match.roundId
          );

          const nextRound = currentRound
            ? roundByNumber.get(
                currentRound.roundNumber + 1
              )
            : undefined;

          if (!nextRound) {
            continue;
          }

          const nextPosition = Math.ceil(
            match.position / 2
          );

          const nextMatch =
            createdMatches.find(
              (candidate) =>
                candidate.roundId ===
                  nextRound.id &&
                candidate.position ===
                  nextPosition
            );

          if (!nextMatch) {
            continue;
          }

          const winnerGoesIntoPlayer1 =
            match.position % 2 === 1;

          const advanceData =
            winnerGoesIntoPlayer1
              ? {
                  player1Id: winnerId,
                  status: nextMatch.player2Id
                    ? ("READY" as const)
                    : ("WAITING" as const),
                }
              : {
                  player2Id: winnerId,
                  status: nextMatch.player1Id
                    ? ("READY" as const)
                    : ("WAITING" as const),
                };

          await tx.match.update({
            where: {
              id: nextMatch.id,
            },
            data: advanceData,
          });

          /*
           * Keep the in-memory copy in sync so
           * a second bye feeding the same next
           * match (both slots filled by byes)
           * is detected correctly above.
           */
          Object.assign(
            nextMatch,
            advanceData
          );
        }

        /*
         * Update tournament status.
         */
        await tx.tournament.update({
          where: {
            id: tournamentId,
          },
          data: {
            status: "IN_PROGRESS",
          },
        });

        /*
         * Record what happened.
         */
        await tx.tournamentHistory.create({
          data: {
            tournamentId,
            action:
              `Bracket generated with ${participants.length} participants.`,
          },
        });

        return {
          rounds,
          matches: createdMatches,
        };
      });

    return NextResponse.json(
      {
        message:
          "Tournament bracket generated successfully.",
        bracketSize,
        numberOfRounds,
        rounds: result.rounds,
        matches: result.matches,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/tournaments/[id]/bracket error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate tournament bracket.",
      },
      { status: 500 }
    );
  }
}
