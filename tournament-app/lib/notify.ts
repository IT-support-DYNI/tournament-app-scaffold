import { Prisma } from "@prisma/client";

/*
 * Fire-and-forget notification for a participant/registrant.
 * Silently does nothing if there's no linked account — most
 * registrations are anonymous, and that's fine.
 */
export async function notifyUser(
  tx: Prisma.TransactionClient,
  userId: number | null | undefined,
  message: string
) {
  if (!userId) {
    return;
  }

  await tx.notification.create({
    data: {
      userId,
      message,
    },
  });
}
