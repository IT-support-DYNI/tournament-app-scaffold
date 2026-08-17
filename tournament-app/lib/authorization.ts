import { UserRole } from "@prisma/client";

/*
 * STAFF create and run their own tournaments. ADMIN can do
 * everything STAFF can, plus manage every tournament and
 * every user's role — not just their own tournaments.
 */
export function canCreateTournaments(role: UserRole) {
  return role === "STAFF" || role === "ADMIN";
}

export function canManageTournament(
  role: UserRole,
  userId: number,
  organizerId: number
) {
  return role === "ADMIN" || userId === organizerId;
}

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}
