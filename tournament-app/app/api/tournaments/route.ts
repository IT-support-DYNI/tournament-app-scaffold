import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function createSlug(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now()
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
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

    if (!name || !startDate || !registrationOpen) {
      return NextResponse.json(
        {
          error:
            "Name, start date, and registration open date are required.",
        },
        { status: 400 }
      );
    }

    if (!maxParticipants || Number(maxParticipants) < 2) {
      return NextResponse.json(
        {
          error: "Maximum participants must be at least 2.",
        },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        slug: createSlug(name),
        organizerId: Number(session.user.id),

        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,

        registrationOpen: new Date(registrationOpen),
        registrationClose: registrationClose
          ? new Date(registrationClose)
          : null,

        maxParticipants: Number(maxParticipants),

        needsContact: Boolean(needsContact),

        drawRule: drawRule ?? "DRAW_NOT_ALLOWED",

        status: "DRAFT",
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("CREATE TOURNAMENT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament.",
      },
      { status: 500 }
    );
  }
}