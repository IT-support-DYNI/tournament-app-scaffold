import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, canCreateTournaments } from "@/lib/authorization";
import StatTile from "@/components/StatTile";
import StatusBadge from "@/components/StatusBadge";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LoggedOutHome />;
  }

  if (isAdmin(session.user.role)) {
    return <AdminHome name={session.user.name ?? "Admin"} />;
  }

  if (canCreateTournaments(session.user.role)) {
    return (
      <StaffHome
        name={session.user.name ?? "there"}
        userId={Number(session.user.id)}
      />
    );
  }

  return (
    <UserHome
      name={session.user.name ?? "there"}
      userId={Number(session.user.id)}
    />
  );
}

// ------------------------------------------------------------
// Logged out — landing page
// ------------------------------------------------------------

async function LoggedOutHome() {
  const [totalTournaments, liveTournaments, completedTournaments] =
    await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.tournament.count({
        where: { status: "COMPLETED" },
      }),
    ]);

  return (
    <main className="min-h-[calc(100vh-65px)] bg-gradient-to-b from-emerald-50 via-white to-white">
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
          ⚽ FC 26 Tournament Manager
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Run tournaments that feel{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            pro-level
          </span>
          .
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Create brackets, manage sign-ups, run matches, and crown a
          champion — all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            Get started free
          </Link>

          <Link
            href="/tournaments"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            Browse tournaments
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-2xl animate-fade-in gap-4 sm:grid-cols-3">
          <StatTile
            label="Tournaments hosted"
            value={totalTournaments}
            icon="🗂️"
            accent="slate"
          />

          <StatTile
            label="Live right now"
            value={liveTournaments}
            icon="🔴"
            accent="emerald"
          />

          <StatTile
            label="Champions crowned"
            value={completedTournaments}
            icon="🏆"
            accent="violet"
          />
        </div>
      </section>
    </main>
  );
}

// ------------------------------------------------------------
// USER — "at a glance" personal dashboard
// ------------------------------------------------------------

async function UserHome({
  name,
  userId,
}: {
  name: string;
  userId: number;
}) {
  const [
    participations,
    pendingRegistrations,
    upcomingMatches,
    notifications,
    unreadCount,
  ] = await Promise.all([
    prisma.participant.findMany({
      where: { userId },
      include: { tournament: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.registration.findMany({
      where: { userId, status: "PENDING" },
      include: { tournament: true },
    }),
    prisma.match.findMany({
      where: {
        status: { in: ["READY", "WAITING"] },
        OR: [
          { player1: { userId } },
          { player2: { userId } },
        ],
      },
      include: {
        tournament: true,
        round: true,
        player1: true,
        player2: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  const nextMatch =
    upcomingMatches.find((m) => m.status === "READY") ??
    upcomingMatches[0] ??
    null;

  const liveCount = upcomingMatches.filter(
    (m) => m.status === "READY"
  ).length;

  const isEmpty =
    participations.length === 0 &&
    pendingRegistrations.length === 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Welcome back, {name} 👋
      </h1>

      <p className="mt-1 text-slate-600">
        Here's what's happening across your tournaments.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Tournaments joined"
          value={participations.length}
          icon="🎮"
          accent="slate"
        />

        <StatTile
          label="Matches ready now"
          value={liveCount}
          icon="🔴"
          accent="emerald"
        />

        <StatTile
          label="Unread notifications"
          value={unreadCount}
          icon="🔔"
          accent="amber"
          href="/notifications"
        />
      </div>

      {nextMatch && (
        <NextMatchCard match={nextMatch} userId={userId} />
      )}

      {isEmpty ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">
            You haven't joined a tournament yet
          </p>

          <p className="mt-1 text-slate-500">
            Browse what's open for registration and jump in.
          </p>

          <Link
            href="/tournaments"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
          >
            Browse tournaments
          </Link>
        </div>
      ) : (
        <>
          {pendingRegistrations.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">
                Awaiting approval
              </h2>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {pendingRegistrations.map((registration) => (
                  <Link
                    key={registration.id}
                    href={`/tournaments/${registration.tournament.id}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition hover:border-amber-300"
                  >
                    <span className="font-medium text-amber-900">
                      {registration.tournament.name}
                    </span>

                    <StatusBadge status="PENDING" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {participations.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">
                My tournaments
              </h2>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {participations.map((participant) => {
                  const isChampion =
                    participant.tournament.status ===
                      "COMPLETED" &&
                    participant.tournament.championId ===
                      participant.id;

                  return (
                    <Link
                      key={participant.id}
                      href={`/tournaments/${participant.tournament.id}/bracket`}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-slate-900">
                          {participant.tournament.name}
                        </p>

                        <StatusBadge
                          status={
                            participant.tournament.status
                          }
                        />
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {isChampion && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-1 text-xs font-bold text-white">
                            🏆 Champion
                          </span>
                        )}

                        <StatusBadge
                          status={participant.status}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Recent notifications
          </h2>

          <Link
            href="/notifications"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View all →
          </Link>
        </div>

        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nothing yet — you'll see updates here as your
            tournaments progress.
          </p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-0 ${
                  notification.read
                    ? "text-slate-500"
                    : "bg-emerald-50/60 font-medium text-slate-900"
                }`}
              >
                <span>{notification.message}</span>

                <span className="whitespace-nowrap text-xs text-slate-400">
                  {notification.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function NextMatchCard({
  match,
  userId,
}: {
  match: {
    id: number;
    status: string;
    tournament: { id: number; name: string };
    round: { name: string };
    position: number;
    player1: { id: number; name: string; userId: number | null } | null;
    player2: { id: number; name: string; userId: number | null } | null;
  };
  userId: number;
}) {
  const isPlayer1Me = match.player1?.userId === userId;
  const opponent = isPlayer1Me ? match.player2 : match.player1;
  const isReady = match.status === "READY";

  return (
    <Link
      href={`/tournaments/${match.tournament.id}/bracket`}
      className="mt-8 block rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isReady ? "animate-pulse bg-emerald-400" : "bg-slate-400"
          }`}
        />

        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {isReady ? "Up next" : "Waiting for opponent"}
        </p>
      </div>

      <p className="mt-2 text-xl font-extrabold">
        {match.tournament.name}
      </p>

      <p className="mt-1 text-slate-300">
        {match.round.name}, Match {match.position} —{" "}
        {opponent
          ? `vs ${opponent.name}`
          : "opponent to be decided"}
      </p>
    </Link>
  );
}

// ------------------------------------------------------------
// STAFF — tournaments they organize
// ------------------------------------------------------------

async function StaffHome({
  name,
  userId,
}: {
  name: string;
  userId: number;
}) {
  const [myTournaments, pendingRegistrationsCount] =
    await Promise.all([
      prisma.tournament.findMany({
        where: { organizerId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              participants: true,
              registrations: true,
            },
          },
        },
      }),
      prisma.registration.count({
        where: {
          tournament: { organizerId: userId },
          status: "PENDING",
        },
      }),
    ]);

  const statusCounts = myTournaments.reduce<
    Record<string, number>
  >((acc, tournament) => {
    acc[tournament.status] =
      (acc[tournament.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {name} 👋
          </h1>

          <p className="mt-1 text-slate-600">
            Here's what's happening with your tournaments.
          </p>
        </div>

        <Link
          href="/tournaments/new"
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/30 transition hover:shadow-md"
        >
          + Create Tournament
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatTile
          label="Total tournaments"
          value={myTournaments.length}
          icon="🗂️"
          accent="slate"
        />

        <StatTile
          label="Live now"
          value={statusCounts.IN_PROGRESS ?? 0}
          icon="🔴"
          accent="emerald"
        />

        <StatTile
          label="Needs attention"
          value={pendingRegistrationsCount}
          icon="⏳"
          accent="amber"
        />

        <StatTile
          label="Completed"
          value={statusCounts.COMPLETED ?? 0}
          icon="🏆"
          accent="violet"
        />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">
          Your tournaments
        </h2>

        {myTournaments.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">
              You haven't created a tournament yet
            </p>

            <Link
              href="/tournaments/new"
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
            >
              Create your first tournament
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {myTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-slate-900">
                    {tournament.name}
                  </p>

                  <StatusBadge status={tournament.status} />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {tournament._count.participants} players ·{" "}
                  {tournament._count.registrations}{" "}
                  registrations
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
                  >
                    Manage
                  </Link>

                  <Link
                    href={`/tournaments/${tournament.id}/bracket`}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
                  >
                    Bracket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ------------------------------------------------------------
// ADMIN — comprehensive app-wide overview
// ------------------------------------------------------------

async function AdminHome({ name }: { name: string }) {
  const [
    tournamentStatusGroups,
    userRoleGroups,
    totalParticipants,
    recentActivity,
  ] = await Promise.all([
    prisma.tournament.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
    prisma.participant.count(),
    prisma.tournamentHistory.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        tournament: { select: { id: true, name: true } },
      },
    }),
  ]);

  const tournamentStatusCounts = Object.fromEntries(
    tournamentStatusGroups.map((group) => [
      group.status,
      group._count,
    ])
  ) as Record<string, number>;

  const userRoleCounts = Object.fromEntries(
    userRoleGroups.map((group) => [group.role, group._count])
  ) as Record<string, number>;

  const totalTournaments = tournamentStatusGroups.reduce(
    (sum, group) => sum + group._count,
    0
  );

  const totalUsers = userRoleGroups.reduce(
    (sum, group) => sum + group._count,
    0
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Admin Overview
      </h1>

      <p className="mt-1 text-slate-600">
        Welcome back, {name}. Here's everything going on
        across the app.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatTile
          label="Total tournaments"
          value={totalTournaments}
          icon="🗂️"
          accent="slate"
          href="/tournaments"
        />

        <StatTile
          label="Live now"
          value={tournamentStatusCounts.IN_PROGRESS ?? 0}
          icon="🔴"
          accent="emerald"
        />

        <StatTile
          label="Total users"
          value={totalUsers}
          icon="👥"
          accent="violet"
          href="/admin/users"
        />

        <StatTile
          label="Total participants"
          value={totalParticipants}
          icon="🎮"
          accent="amber"
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">
            Tournaments by status
          </h2>

          <div className="mt-3 space-y-2">
            {Object.entries(tournamentStatusCounts).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between"
                >
                  <StatusBadge status={status} />

                  <span className="text-sm font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              Users by role
            </h2>

            <Link
              href="/admin/users"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Manage →
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {Object.entries(userRoleCounts).map(
              ([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {role}
                  </span>

                  <span className="text-sm font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">
          Recent activity
        </h2>

        {recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nothing has happened yet.
          </p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-0"
              >
                <span className="text-slate-700">
                  <Link
                    href={`/tournaments/${entry.tournament.id}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700"
                  >
                    {entry.tournament.name}
                  </Link>{" "}
                  — {entry.action}
                </span>

                <span className="whitespace-nowrap text-xs text-slate-400">
                  {entry.createdAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
