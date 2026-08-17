import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authorization";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

const VALID_ROLES: UserRole[] = [
  "USER",
  "STAFF",
  "ADMIN",
];

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

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        {
          error: "Only admins can manage users.",
        },
        { status: 403 }
      );
    }

    const { userId } = await context.params;
    const userIdNumber = Number(userId);

    if (!Number.isInteger(userIdNumber)) {
      return NextResponse.json(
        {
          error: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    if (userIdNumber === Number(session.user.id)) {
      return NextResponse.json(
        {
          error:
            "You can't change your own role.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error:
            "Role must be USER, STAFF, or ADMIN.",
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique(
      {
        where: {
          id: userIdNumber,
        },
      }
    );

    if (!targetUser) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userIdNumber,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Role updated.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/users/[userId] error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update user role.",
      },
      { status: 500 }
    );
  }
}
