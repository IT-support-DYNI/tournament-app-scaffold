import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    registrationId: string;
  }>;
};

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
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id, registrationId } =
      await context.params;

    const tournamentId = Number(id);
    const registrationIdNumber =
      Number(registrationId);

    if (
      !Number.isInteger(tournamentId) ||
      !Number.isInteger(registrationIdNumber)
    ) {
      return NextResponse.json(
        { error: "Invalid ID." },
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
            "You are not authorized to manage registrations for this tournament.",
        },
        { status: 403 }
      );
    }

    const registration =
      await prisma.registration.findFirst({
        where: {
          id: registrationIdNumber,
          tournamentId,
        },
        include: {
          participant: true,
        },
      });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const { status } = body;

    if (
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      return NextResponse.json(
        {
          error:
            "Status must be APPROVED or REJECTED.",
        },
        { status: 400 }
      );
    }

    if (registration.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "Only pending registrations can be approved or rejected.",
        },
        { status: 400 }
      );
    }

    if (status === "REJECTED") {
      const updatedRegistration =
        await prisma.registration.update({
          where: {
            id: registration.id,
          },
          data: {
            status: "REJECTED",
          },
        });

      return NextResponse.json({
        message:
          "Registration rejected successfully.",
        registration: updatedRegistration,
      });
    }

    // Check tournament capacity again
    // before approving.

    const participantCount =
      await prisma.participant.count({
        where: {
          tournamentId,
        },
      });

    if (
      participantCount >=
      tournament.maxParticipants
    ) {
      return NextResponse.json(
        {
          error:
            "The tournament is already full.",
        },
        { status: 400 }
      );
    }

    // Approve registration and create participant
    // atomically.

    const result = await prisma.$transaction(
      async (tx) => {
        const updatedRegistration =
          await tx.registration.update({
            where: {
              id: registration.id,
            },
            data: {
              status: "APPROVED",
            },
          });

        const participant =
          await tx.participant.create({
            data: {
              tournamentId,
              registrationId:
                registration.id,
              name: registration.name,
              age: registration.age,
              club: registration.club,
              email: registration.email,
              phone: registration.phone,
              status: "ACTIVE",
            },
          });

        return {
          updatedRegistration,
          participant,
        };
      }
    );

    return NextResponse.json({
      message:
        "Registration approved and participant created.",
      registration: result.updatedRegistration,
      participant: result.participant,
    });
  } catch (error) {
    console.error(
      "PATCH registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update registration.",
      },
      { status: 500 }
    );
  }
}