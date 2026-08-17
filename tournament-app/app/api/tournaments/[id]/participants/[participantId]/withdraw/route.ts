import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    participantId: string;
  }>;
};

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

    const { id, participantId } =
      await context.params;

    const tournamentId = Number(id);
    const participantIdNumber = Number(
      participantId
    );

    if (
      !Number.isInteger(tournamentId) ||
      !Number.isInteger(participantIdNumber)
    ) {
      return NextResponse.json(
        {
          error: "Invalid tournament or participant ID.",
        },
        { status: 400 }
      );
    }

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentId,
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

    if (
      tournament.organizerId !==
      Number(session.user.id)
    ) {
      return NextResponse.json(
        {
          error:
            "Only the tournament organizer can withdraw a participant.",
        },
        { status: 403 }
      );
    }

    const participant =
      await prisma.participant.findFirst({
        where: {
          id: participantIdNumber,
          tournamentId,
        },
      });

    if (!participant) {
      return NextResponse.json(
        {
          error: "Participant not found.",
        },
        { status: 404 }
      );
    }

    if (participant.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "Only active participants can be withdrawn.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.participant.update({
          where: {
            id: participant.id,
          },
          data: {
            status: "INACTIVE",
          },
        });

        /*
         * If the bracket hasn't been generated yet,
         * there's nothing else to do — bracket
         * generation only pulls in ACTIVE
         * participants, so this withdrawal is
         * already fully handled.
         */
        const liveMatch =
          await tx.match.findFirst({
            where: {
              tournamentId,
              status: {
                in: ["READY", "WAITING"],
              },
              OR: [
                {
                  player1Id: participant.id,
                },
                {
                  player2Id: participant.id,
                },
              ],
            },
            include: {
              round: true,
              player1: true,
              player2: true,
            },
          });

        /*
         * If their match is still WAITING on an
         * undetermined opponent, leave it alone —
         * once that opponent is decided the match
         * naturally becomes a normal, playable
         * match with the withdrawn participant in
         * one slot, and the organizer resolves it
         * with a standard WALKOVER through the
         * usual result form. No special-casing
         * needed there.
         */
        if (
          !liveMatch ||
          liveMatch.status !== "READY"
        ) {
          await tx.tournamentHistory.create({
            data: {
              tournamentId,
              action: `${participant.name} withdrew from the tournament.`,
            },
          });

          return { walkoverWinnerId: null };
        }

        const opponent =
          liveMatch.player1Id === participant.id
            ? liveMatch.player2
            : liveMatch.player1;

        if (!opponent) {
          await tx.tournamentHistory.create({
            data: {
              tournamentId,
              action: `${participant.name} withdrew from the tournament.`,
            },
          });

          return { walkoverWinnerId: null };
        }

        await tx.match.update({
          where: {
            id: liveMatch.id,
          },
          data: {
            winnerId: opponent.id,
            resultType: "WALKOVER",
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await tx.tournamentHistory.create({
          data: {
            tournamentId,
            action: `${participant.name} withdrew from the tournament; ${opponent.name} advances by walkover.`,
          },
        });

        // ------------------------------------------------
        // Advance the opponent to the next round, exactly
        // like a normal match result.
        // ------------------------------------------------

        const nextRound =
          await tx.round.findFirst({
            where: {
              tournamentId,
              roundNumber:
                liveMatch.round.roundNumber + 1,
            },
          });

        if (nextRound) {
          const nextPosition = Math.ceil(
            liveMatch.position / 2
          );

          const nextMatch =
            await tx.match.findFirst({
              where: {
                roundId: nextRound.id,
                position: nextPosition,
              },
            });

          if (nextMatch) {
            const winnerGoesIntoPlayer1 =
              liveMatch.position % 2 === 1;

            await tx.match.update({
              where: {
                id: nextMatch.id,
              },
              data: winnerGoesIntoPlayer1
                ? {
                    player1Id: opponent.id,
                    status: nextMatch.player2Id
                      ? "READY"
                      : "WAITING",
                  }
                : {
                    player2Id: opponent.id,
                    status: nextMatch.player1Id
                      ? "READY"
                      : "WAITING",
                  },
            });
          }
        } else {
          // The withdrawal happened in the final.
          await tx.tournament.update({
            where: {
              id: tournamentId,
            },
            data: {
              status: "COMPLETED",
              championId: opponent.id,
            },
          });

          await tx.tournamentHistory.create({
            data: {
              tournamentId,
              action: `Tournament completed via walkover. Champion: ${opponent.name}.`,
            },
          });
        }

        return { walkoverWinnerId: opponent.id };
      }
    );

    return NextResponse.json({
      message: "Participant withdrawn.",
      ...result,
    });
  } catch (error) {
    console.error(
      "POST /api/tournaments/[id]/participants/[participantId]/withdraw error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to withdraw participant.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
