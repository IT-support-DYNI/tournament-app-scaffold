import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/tournaments/[id]
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tournamentId = Number(id);

    if (!Number.isInteger(tournamentId)) {
      return NextResponse.json(
        { error: "Invalid tournament ID." },
        { status: 400 }
      );
    }

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentId,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          participants: true,

          registrations: true,

          rounds: {
            orderBy: {
              roundNumber: "asc",
            },
          },

          matches: {
            orderBy: [
              {
                roundId: "asc",
              },
              {
                position: "asc",
              },
            ],
            include: {
              round: true,
              player1: true,
              player2: true,
              winner: true,
              result: true,
            },
          },

          history: {
            orderBy: {
              createdAt: "desc",
            },
          },

          _count: {
            select: {
              participants: true,
              registrations: true,
              matches: true,
            },
          },
        },
      });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error(
      "GET /api/tournaments/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch tournament.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id]
export async function PATCH(
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
      });

    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    // Only the organizer can edit the tournament.
    if (
      tournament.organizerId !==
      Number(session.user.id)
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to edit this tournament.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      name,
      startDate,
      endDate,
      registrationOpen,
      registrationClose,
      maxParticipants,
      needsContact,
      drawRule,
    } = body;

    const data: {
      name?: string;
      startDate?: Date;
      endDate?: Date | null;
      registrationOpen?: Date;
      registrationClose?: Date | null;
      maxParticipants?: number;
      needsContact?: boolean;
      drawRule?: typeof tournament.drawRule;
    } = {};

    // NAME
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Tournament name cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.name = name.trim();
    }

    // START DATE
    if (startDate !== undefined) {
      const parsed = new Date(startDate);

      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            error: "Invalid start date.",
          },
          { status: 400 }
        );
      }

      data.startDate = parsed;
    }

    // END DATE
    if (endDate !== undefined) {
      if (
        endDate === null ||
        endDate === ""
      ) {
        data.endDate = null;
      } else {
        const parsed = new Date(endDate);

        if (
          Number.isNaN(parsed.getTime())
        ) {
          return NextResponse.json(
            {
              error: "Invalid end date.",
            },
            { status: 400 }
          );
        }

        data.endDate = parsed;
      }
    }

    // REGISTRATION OPEN
    if (registrationOpen !== undefined) {
      const parsed = new Date(
        registrationOpen
      );

      if (
        Number.isNaN(parsed.getTime())
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid registration open date.",
          },
          { status: 400 }
        );
      }

      data.registrationOpen = parsed;
    }

    // REGISTRATION CLOSE
    if (registrationClose !== undefined) {
      if (
        registrationClose === null ||
        registrationClose === ""
      ) {
        data.registrationClose = null;
      } else {
        const parsed = new Date(
          registrationClose
        );

        if (
          Number.isNaN(parsed.getTime())
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid registration close date.",
            },
            { status: 400 }
          );
        }

        data.registrationClose = parsed;
      }
    }

    // MAX PARTICIPANTS
    if (maxParticipants !== undefined) {
      const parsed = Number(
        maxParticipants
      );

      if (
        !Number.isInteger(parsed) ||
        parsed < 2
      ) {
        return NextResponse.json(
          {
            error:
              "Maximum participants must be an integer of at least 2.",
          },
          { status: 400 }
        );
      }

      data.maxParticipants = parsed;
    }

    // CONTACT REQUIREMENT
    if (needsContact !== undefined) {
      if (typeof needsContact !== "boolean") {
        return NextResponse.json(
          {
            error:
              "needsContact must be true or false.",
          },
          { status: 400 }
        );
      }

      data.needsContact = needsContact;
    }

    // DRAW RULE
    if (drawRule !== undefined) {
      data.drawRule = drawRule;
    }

    const updatedTournament =
      await prisma.tournament.update({
        where: {
          id: tournamentId,
        },
        data,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return NextResponse.json(
      updatedTournament
    );
  } catch (error) {
    console.error(
      "PATCH /api/tournaments/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update tournament.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id]
export async function DELETE(
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
      });

    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found.",
        },
        { status: 404 }
      );
    }

    // Only the organizer can delete the tournament.
    if (
      tournament.organizerId !==
      Number(session.user.id)
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to delete this tournament.",
        },
        { status: 403 }
      );
    }

    await prisma.tournament.delete({
      where: {
        id: tournamentId,
      },
    });

    return NextResponse.json({
      message: "Tournament deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/tournaments/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete tournament.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}