import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { id, matchId } = await context.params;

    const tournamentId = Number(id);
    const matchIdNumber = Number(matchId);
    const userId = Number(session.user.id);

    if (
      !Number.isInteger(tournamentId) ||
      !Number.isInteger(matchIdNumber)
    ) {
      return NextResponse.json(
        {
          error: "Invalid tournament or match ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Load tournament and match
    // --------------------------------------------------

    const match = await prisma.match.findFirst({
      where: {
        id: matchIdNumber,
        tournamentId,
      },
      include: {
        tournament: true,
        round: true,
        player1: true,
        player2: true,
        winner: true,
        result: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          error: "Match not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 3. Only tournament organizer can submit results
    // --------------------------------------------------

    if (match.tournament.organizerId !== userId) {
      return NextResponse.json(
        {
          error:
            "Only the tournament organizer can submit match results.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 4. Don't allow a completed match to be submitted again
    // --------------------------------------------------

    if (match.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "This match has already been completed.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. A normal match needs two players
    // --------------------------------------------------

    if (!match.player1 || !match.player2) {
      return NextResponse.json(
        {
          error:
            "Both players must be assigned before submitting a result.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Read request body
    // --------------------------------------------------

    const body = await request.json();

    const {
      player1Score,
      player2Score,
      player1PenaltyScore,
      player2PenaltyScore,
      resultType,
      winnerId,
      notes,
    } = body;

    const allowedResultTypes = [
      "NORMAL",
      "DRAW",
      "WALKOVER",
      "PENALTY",
    ];

    if (!allowedResultTypes.includes(resultType)) {
      return NextResponse.json(
        {
          error: "Invalid result type.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 7. Convert scores
    // --------------------------------------------------

    const parsedPlayer1Score =
      player1Score === "" ||
      player1Score === null ||
      player1Score === undefined
        ? null
        : Number(player1Score);

    const parsedPlayer2Score =
      player2Score === "" ||
      player2Score === null ||
      player2Score === undefined
        ? null
        : Number(player2Score);

    const parsedPlayer1PenaltyScore =
      player1PenaltyScore === "" ||
      player1PenaltyScore === null ||
      player1PenaltyScore === undefined
        ? null
        : Number(player1PenaltyScore);

    const parsedPlayer2PenaltyScore =
      player2PenaltyScore === "" ||
      player2PenaltyScore === null ||
      player2PenaltyScore === undefined
        ? null
        : Number(player2PenaltyScore);

    // --------------------------------------------------
    // 8. Validate score values
    // --------------------------------------------------

    const scores = [
      parsedPlayer1Score,
      parsedPlayer2Score,
      parsedPlayer1PenaltyScore,
      parsedPlayer2PenaltyScore,
    ];

    for (const score of scores) {
      if (
        score !== null &&
        (!Number.isInteger(score) || score < 0)
      ) {
        return NextResponse.json(
          {
            error:
              "Scores must be whole numbers greater than or equal to 0.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 9. Determine winner
    // --------------------------------------------------

    let finalWinnerId: number | null = null;

    // NORMAL
    if (resultType === "NORMAL") {
      if (
        parsedPlayer1Score === null ||
        parsedPlayer2Score === null
      ) {
        return NextResponse.json(
          {
            error:
              "Both player scores are required for a normal result.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1Score ===
        parsedPlayer2Score
      ) {
        return NextResponse.json(
          {
            error:
              "The match is tied. Select DRAW or use a penalty result.",
          },
          { status: 400 }
        );
      }

      finalWinnerId =
        parsedPlayer1Score >
        parsedPlayer2Score
          ? match.player1.id
          : match.player2.id;
    }

    // DRAW
    else if (resultType === "DRAW") {
      if (
        match.tournament.drawRule !==
        "DRAW_ALLOWED"
      ) {
        return NextResponse.json(
          {
            error:
              "Draws are not allowed for this tournament.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1Score === null ||
        parsedPlayer2Score === null
      ) {
        return NextResponse.json(
          {
            error:
              "Both player scores are required for a draw.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1Score !==
        parsedPlayer2Score
      ) {
        return NextResponse.json(
          {
            error:
              "A DRAW result requires equal scores.",
          },
          { status: 400 }
        );
      }

      finalWinnerId = null;
    }

    // WALKOVER
    else if (resultType === "WALKOVER") {
      const selectedWinnerId = Number(winnerId);

      if (
        selectedWinnerId !== match.player1.id &&
        selectedWinnerId !== match.player2.id
      ) {
        return NextResponse.json(
          {
            error:
              "The walkover winner must be one of the two players.",
          },
          { status: 400 }
        );
      }

      finalWinnerId = selectedWinnerId;
    }

    // PENALTY
    else if (resultType === "PENALTY") {
      if (
        match.tournament.drawRule !==
        "PENALTY_DECIDES"
      ) {
        return NextResponse.json(
          {
            error:
              "Penalty shootouts are not configured for this tournament.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1Score === null ||
        parsedPlayer2Score === null
      ) {
        return NextResponse.json(
          {
            error:
              "The normal scores are required before penalty scores.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1PenaltyScore === null ||
        parsedPlayer2PenaltyScore === null
      ) {
        return NextResponse.json(
          {
            error:
              "Both penalty scores are required.",
          },
          { status: 400 }
        );
      }

      if (
        parsedPlayer1PenaltyScore ===
        parsedPlayer2PenaltyScore
      ) {
        return NextResponse.json(
          {
            error:
              "Penalty scores cannot be tied.",
          },
          { status: 400 }
        );
      }

      finalWinnerId =
        parsedPlayer1PenaltyScore >
        parsedPlayer2PenaltyScore
          ? match.player1.id
          : match.player2.id;
    }

    // --------------------------------------------------
    // 10. Save everything in one transaction
    // --------------------------------------------------

    const updatedMatch =
      await prisma.$transaction(
        async (tx) => {
          const completedMatch =
            await tx.match.update({
              where: {
                id: match.id,
              },
              data: {
                player1Score:
                  parsedPlayer1Score,
                player2Score:
                  parsedPlayer2Score,
                player1PenaltyScore:
                  parsedPlayer1PenaltyScore,
                player2PenaltyScore:
                  parsedPlayer2PenaltyScore,
                resultType,
                winnerId: finalWinnerId,
                status: "COMPLETED",
                completedAt: new Date(),
              },
              include: {
                round: true,
                player1: true,
                player2: true,
                winner: true,
                result: true,
              },
            });

          // ------------------------------------------------
          // Create/update MatchResult
          // ------------------------------------------------

          if (match.result) {
            await tx.matchResult.update({
              where: {
                matchId: match.id,
              },
              data: {
                notes:
                  typeof notes === "string" &&
                  notes.trim()
                    ? notes.trim()
                    : null,
              },
            });
          } else {
            await tx.matchResult.create({
              data: {
                matchId: match.id,
                notes:
                  typeof notes === "string" &&
                  notes.trim()
                    ? notes.trim()
                    : null,
              },
            });
          }

          // ------------------------------------------------
          // 11. Advance winner to next round
          // ------------------------------------------------

          if (finalWinnerId !== null) {
            const nextRound =
              await tx.round.findFirst({
                where: {
                  tournamentId,
                  roundNumber:
                    match.round.roundNumber + 1,
                },
              });

            if (nextRound) {
              /*
               * Match positions:
               *
               * Match 1 + Match 2
               *       ↓
               *   next Match 1
               *
               * Match 3 + Match 4
               *       ↓
               *   next Match 2
               */

              const nextPosition =
                Math.ceil(match.position / 2);

              const nextMatch =
                await tx.match.findFirst({
                  where: {
                    roundId: nextRound.id,
                    position: nextPosition,
                  },
                });

              if (nextMatch) {
                const winnerGoesIntoPlayer1 =
                  match.position % 2 === 1;

                await tx.match.update({
                  where: {
                    id: nextMatch.id,
                  },
                  data:
                    winnerGoesIntoPlayer1
                      ? {
                          player1Id:
                            finalWinnerId,
                          status:
                            nextMatch.player2Id
                              ? "READY"
                              : "WAITING",
                        }
                      : {
                          player2Id:
                            finalWinnerId,
                          status:
                            nextMatch.player1Id
                              ? "READY"
                              : "WAITING",
                        },
                });
              }
            }
          }

          // ------------------------------------------------
          // 12. If this was the final, complete tournament
          // ------------------------------------------------

          const nextRound =
            await tx.round.findFirst({
              where: {
                tournamentId,
                roundNumber:
                  match.round.roundNumber + 1,
              },
            });

          if (!nextRound) {
            await tx.tournament.update({
              where: {
                id: tournamentId,
              },
              data: {
                status: "COMPLETED",
              },
            });
          } else {
            // Tournament has started once a result is recorded.
            await tx.tournament.update({
              where: {
                id: tournamentId,
              },
              data: {
                status: "IN_PROGRESS",
              },
            });
          }

          return completedMatch;
        }
      );

    return NextResponse.json({
      message: "Match result submitted successfully.",
      match: updatedMatch,
      winnerId: finalWinnerId,
    });
  } catch (error) {
    console.error(
      "PATCH /api/tournaments/[id]/matches/[matchId] error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to submit match result.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}