import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: Number(session.user.id),
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error(
      "GET /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch notifications.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const userId = Number(session.user.id);
    const body = await request.json();

    if (body.markAllRead === true) {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        message: "All notifications marked as read.",
      });
    }

    const notificationId = Number(
      body.notificationId
    );

    if (!Number.isInteger(notificationId)) {
      return NextResponse.json(
        {
          error: "Invalid notification ID.",
        },
        { status: 400 }
      );
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          error: "Notification not found.",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      notification: updated,
    });
  } catch (error) {
    console.error(
      "PATCH /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update notification.",
      },
      { status: 500 }
    );
  }
}
