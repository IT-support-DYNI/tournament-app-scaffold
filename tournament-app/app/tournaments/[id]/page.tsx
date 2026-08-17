import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canManageTournament } from "@/lib/authorization";
import StatusBadge from "@/components/StatusBadge";
import DeleteTournamentButton from "./DeleteTournamentButton";
import GenerateBracketButton from "./GenerateBracketButton";
import TournamentStatusControls from "./TournamentStatusControls";

type TournamentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TournamentPage({
  params,
}: TournamentPageProps) {
  const { id } = await params;

  const response = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/tournaments/${id}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to load tournament.");
  }

  const tournament = await response.json();

  const session = await getServerSession(authOptions);

  const isOwner =
    Boolean(session?.user?.id) &&
    canManageTournament(
      session!.user.role,
      Number(session!.user.id),
      tournament.organizerId
    );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/tournaments"
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back to tournaments
          </Link>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {tournament.name}
            </h1>

            <StatusBadge status={tournament.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {tournament.status === "REGISTRATION_OPEN" && (
            <Link
              href={`/tournaments/${tournament.id}/register`}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-500/30 transition hover:shadow-md"
            >
              Register
            </Link>
          )}

          <Link
            href={`/tournaments/${tournament.id}/bracket`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Bracket
          </Link>

          {isOwner && (
            <>
              <TournamentStatusControls
                tournamentId={tournament.id}
                status={tournament.status}
              />

              <Link
                href={`/tournaments/${tournament.id}/registrations`}
                className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
              >
                Manage Registrations
              </Link>

              <Link
                href={`/tournaments/${tournament.id}/edit`}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Edit
              </Link>

              <GenerateBracketButton
                tournamentId={tournament.id}
              />

              <DeleteTournamentButton
                tournamentId={tournament.id}
              />
            </>
          )}
        </div>
      </div>

      {tournament.status === "COMPLETED" &&
        tournament.champion && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
              🏆 Champion
            </p>

            <p className="mt-1 text-3xl font-extrabold text-amber-900">
              {tournament.champion.name}
            </p>
          </div>
        )}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Tournament Details
          </h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <Detail label="Status">
              <StatusBadge status={tournament.status} />
            </Detail>

            <Detail label="Start">
              {new Date(
                tournament.startDate
              ).toLocaleString()}
            </Detail>

            {tournament.endDate && (
              <Detail label="End">
                {new Date(
                  tournament.endDate
                ).toLocaleString()}
              </Detail>
            )}

            <Detail label="Maximum Participants">
              {tournament.maxParticipants}
            </Detail>

            <Detail label="Draw Rule">
              {tournament.drawRule}
            </Detail>

            <Detail label="Contact Required">
              {tournament.needsContact ? "Yes" : "No"}
            </Detail>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Registration
          </h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <Detail label="Opens">
              {new Date(
                tournament.registrationOpen
              ).toLocaleString()}
            </Detail>

            <Detail label="Closes">
              {tournament.registrationClose
                ? new Date(
                    tournament.registrationClose
                  ).toLocaleString()
                : "No closing date"}
            </Detail>

            <Detail label="Registered">
              {tournament._count.registrations}
            </Detail>

            <Detail label="Participants">
              {tournament._count.participants}
            </Detail>
          </dl>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">
          Organizer
        </h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <Detail label="Name">
            {tournament.organizer.name}
          </Detail>

          <Detail label="Email">
            {tournament.organizer.email}
          </Detail>
        </dl>
      </section>

      {tournament.history &&
        tournament.history.length > 0 && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Activity
            </h2>

            <ul className="mt-4 divide-y divide-slate-100">
              {tournament.history.map(
                (entry: {
                  id: number;
                  action: string;
                  createdAt: string;
                }) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="text-slate-700">
                      {entry.action}
                    </span>

                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {new Date(
                        entry.createdAt
                      ).toLocaleString()}
                    </span>
                  </li>
                )
              )}
            </ul>
          </section>
        )}
    </main>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">
        {children}
      </dd>
    </div>
  );
}
