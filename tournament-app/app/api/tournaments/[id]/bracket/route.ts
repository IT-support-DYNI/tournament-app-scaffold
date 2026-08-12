import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

    // Only the organizer can generate
    // the bracket.

    if (
      tournament.organizerId !==
      Number(session.user.id)
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

    /*
     * Create the bracket slots.
     *
     * Example:
     *
     * 6 players
     * ↓
     * 8 slots
     *
     * 8 players
     * ↓
     * 8 slots
     */
    const slots = [
      ...shuffledParticipants,
      ...Array(
        bracketSize - shuffledParticipants.length
      ).fill(null),
    ];

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
             * Round 1 gets actual participants.
             */
            if (round.roundNumber === 1) {
              const slot1 =
                slots[(position - 1) * 2];

              const slot2 =
                slots[(position - 1) * 2 + 1];

              player1Id =
                slot1?.id ?? null;

              player2Id =
                slot2?.id ?? null;

              /*
               * Both players exist.
               */
              if (player1Id && player2Id) {
                status = "READY";
              }

              /*
               * Only one player exists.
               * This is a BYE.
               */
              else if (
                player1Id ||
                player2Id
              ) {
                status = "BYE";
              }

              /*
               * Neither player exists.
               */
              else {
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
          }
        }

        /*
         * For BYE matches, the only player
         * automatically becomes the winner.
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