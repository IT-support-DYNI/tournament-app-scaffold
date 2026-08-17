import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateTournaments } from "@/lib/authorization";
import StatusBadge from "@/components/StatusBadge";

export default async function TournamentsPage() {
  const session = await getServerSession(authOptions);

  const canCreate = Boolean(
    session?.user?.role &&
      canCreateTournaments(session.user.role)
  );

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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Tournaments
          </h1>

          <p className="mt-1 text-slate-600">
            Browse and manage tournaments.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/tournaments/new"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/30 transition hover:shadow-md"
          >
            + Create Tournament
          </Link>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            No tournaments yet
          </h2>

          <p className="mt-1 text-slate-500">
            Create your first tournament to get started.
          </p>

          {canCreate && (
            <Link
              href="/tournaments/new"
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
            >
              Create Tournament
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                  {tournament.name}
                </h2>

                <StatusBadge status={tournament.status} />
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                <p>
                  <span className="text-slate-400">Organizer:</span>{" "}
                  {tournament.organizer.name}
                </p>

                <p>
                  <span className="text-slate-400">Players:</span>{" "}
                  {tournament._count.participants} /{" "}
                  {tournament.maxParticipants}
                </p>

                <p>
                  <span className="text-slate-400">Registrations:</span>{" "}
                  {tournament._count.registrations}
                </p>

                <p>
                  <span className="text-slate-400">Starts:</span>{" "}
                  {tournament.startDate.toLocaleDateString()}
                </p>
              </div>

              <span className="mt-5 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                View tournament →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
