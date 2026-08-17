import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
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
    Number(session?.user?.id) === tournament.organizerId;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/tournaments"
              className="text-sm text-gray-600 hover:text-black"
            >
              ← Back to tournaments
            </Link>

            <h1 className="mt-2 text-3xl font-bold">
              {tournament.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {tournament.status === "REGISTRATION_OPEN" && (
              <Link
                href={`/tournaments/${tournament.id}/register`}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Register
              </Link>
            )}

            <Link
                href={`/tournaments/${tournament.id}/bracket`}
                 className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Manage Registrations
                </Link>

                <Link
                  href={`/tournaments/${tournament.id}/edit`}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Edit Tournament
                </Link>

                <DeleteTournamentButton
                  tournamentId={tournament.id}
                />
                <GenerateBracketButton
                    tournamentId={tournament.id}
                />
              </>
            )}
          </div>
        </div>

        {tournament.status === "COMPLETED" &&
          tournament.champion && (
            <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-300 p-6 text-center shadow">
              <p className="text-sm font-medium uppercase tracking-wide text-yellow-700">
                🏆 Champion
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-900">
                {tournament.champion.name}
              </p>
            </div>
          )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">
              Tournament Details
            </h2>

            <div className="mt-4 space-y-3 text-gray-700">
              <p>
                <strong>Status:</strong>{" "}
                {tournament.status}
              </p>

              <p>
                <strong>Start:</strong>{" "}
                {new Date(
                  tournament.startDate
                ).toLocaleString()}
              </p>

              {tournament.endDate && (
                <p>
                  <strong>End:</strong>{" "}
                  {new Date(
                    tournament.endDate
                  ).toLocaleString()}
                </p>
              )}

              <p>
                <strong>Maximum Participants:</strong>{" "}
                {tournament.maxParticipants}
              </p>

              <p>
                <strong>Draw Rule:</strong>{" "}
                {tournament.drawRule}
              </p>

              <p>
                <strong>Contact Required:</strong>{" "}
                {tournament.needsContact ? "Yes" : "No"}
              </p>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">
              Registration
            </h2>

            <div className="mt-4 space-y-3 text-gray-700">
              <p>
                <strong>Opens:</strong>{" "}
                {new Date(
                  tournament.registrationOpen
                ).toLocaleString()}
              </p>

              <p>
                <strong>Closes:</strong>{" "}
                {tournament.registrationClose
                  ? new Date(
                      tournament.registrationClose
                    ).toLocaleString()
                  : "No closing date"}
              </p>

              <p>
                <strong>Registered:</strong>{" "}
                {tournament._count.registrations}
              </p>

              <p>
                <strong>Participants:</strong>{" "}
                {tournament._count.participants}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Organizer
          </h2>

          <div className="mt-4 text-gray-700">
            <p>
              <strong>Name:</strong>{" "}
              {tournament.organizer.name}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {tournament.organizer.email}
            </p>
          </div>
        </section>

        {tournament.history &&
          tournament.history.length > 0 && (
            <section className="mt-6 rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold">
                Activity
              </h2>

              <ul className="mt-4 space-y-3">
                {tournament.history.map(
                  (entry: {
                    id: number;
                    action: string;
                    createdAt: string;
                  }) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <span className="text-gray-700">
                        {entry.action}
                      </span>

                      <span className="whitespace-nowrap text-xs text-gray-400">
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
      </div>
    </main>
  );
}