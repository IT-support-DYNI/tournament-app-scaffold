import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            participants: true,
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

    const now = new Date();

    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json(
        {
          error:
            "Registration is not currently open for this tournament.",
        },
        { status: 400 }
      );
    }

    if (now < tournament.registrationOpen) {
      return NextResponse.json(
        {
          error:
            "Registration has not opened yet.",
        },
        { status: 400 }
      );
    }

    if (
      tournament.registrationClose &&
      now > tournament.registrationClose
    ) {
      return NextResponse.json(
        {
          error:
            "Registration for this tournament has closed.",
        },
        { status: 400 }
      );
    }

    if (
      tournament._count.registrations >=
      tournament.maxParticipants
    ) {
      return NextResponse.json(
        {
          error:
            "This tournament is full.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      age,
      club,
      email,
      phone,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    const parsedAge = Number(age);

    if (
      !Number.isInteger(parsedAge) ||
      parsedAge < 1 ||
      parsedAge > 120
    ) {
      return NextResponse.json(
        { error: "Please provide a valid age." },
        { status: 400 }
      );
    }

    if (
      tournament.needsContact &&
      (!email?.trim() && !phone?.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Email or phone number is required for this tournament.",
        },
        { status: 400 }
      );
    }

    const registration =
      await prisma.registration.create({
        data: {
          tournamentId,
          name: name.trim(),
          age: parsedAge,
          club:
            typeof club === "string" && club.trim()
              ? club.trim()
              : null,
          email:
            typeof email === "string" && email.trim()
              ? email.trim()
              : null,
          phone:
            typeof phone === "string" && phone.trim()
              ? phone.trim()
              : null,
          status: "PENDING",
        },
      });

    return NextResponse.json(
      {
        message:
          "Registration submitted successfully.",
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/tournaments/[id]/register error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit registration.",
      },
      { status: 500 }
    );
  }
}