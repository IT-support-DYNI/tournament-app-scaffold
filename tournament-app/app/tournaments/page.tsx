import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions);

  const tournaments = await prisma.tournament.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          participants: true,
          registrations: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Tournaments
            </h1>

            <p className="mt-2 text-gray-600">
              Browse and manage tournaments.
            </p>
          </div>

          {session && (
            <Link
              href="/tournaments/new"
              className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create Tournament
            </Link>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold">
              No tournaments yet
            </h2>

            <p className="mt-2 text-gray-500">
              Create your first tournament to get started.
            </p>

            {session && (
              <Link
                href="/tournaments/new"
                className="mt-6 inline-block rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Create Tournament
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="rounded-lg bg-white p-6 shadow"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    {tournament.name}
                  </h2>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    {tournament.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Organizer:</strong>{" "}
                    {tournament.organizer.name}
                  </p>

                  <p>
                    <strong>Max participants:</strong>{" "}
                    {tournament.maxParticipants}
                  </p>

                  <p>
                    <strong>Participants:</strong>{" "}
                    {tournament._count.participants}
                  </p>

                  <p>
                    <strong>Registrations:</strong>{" "}
                    {tournament._count.registrations}
                  </p>

                  <p>
                    <strong>Starts:</strong>{" "}
                    {tournament.startDate.toLocaleString()}
                  </p>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="text-sm font-medium underline"
                  >
                    View Tournament
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}