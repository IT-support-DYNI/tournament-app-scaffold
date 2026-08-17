import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

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
      });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
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
            "You are not authorized to view registrations for this tournament.",
        },
        { status: 403 }
      );
    }

    const registrations =
      await prisma.registration.findMany({
        where: {
          tournamentId,
        },
        include: {
          participant: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      registrations,
    });
  } catch (error) {
    console.error(
      "GET /api/tournaments/[id]/registrations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch registrations.",
      },
      { status: 500 }
    );
  }
}