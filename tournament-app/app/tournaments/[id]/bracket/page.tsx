import Link from "next/link";

import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BracketPage({
  params,
}: Props) {
  const { id } = await params;

  const tournamentId = Number(id);

  if (!Number.isInteger(tournamentId)) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Invalid tournament ID
        </h1>
      </main>
    );
  }

  const tournament =
    await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        rounds: {
          orderBy: {
            roundNumber: "asc",
          },
          include: {
            matches: {
              orderBy: {
                position: "asc",
              },
              include: {
                player1: true,
                player2: true,
                winner: true,
              },
            },
          },
        },
      },
    });

  if (!tournament) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Tournament not found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Tournament
          </Link>

          <h1 className="mt-2 text-3xl font-bold">
            {tournament.name}
          </h1>

          <p className="mt-1 text-gray-600">
            Tournament Bracket
          </p>
        </div>

        {tournament.rounds.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h2 className="text-xl font-semibold">
              Bracket has not been generated
            </h2>

            <p className="mt-2 text-gray-600">
              Generate the bracket once enough
              participants have been approved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-12">
              {tournament.rounds.map(
                (round) => (
                  <div
                    key={round.id}
                    className="w-64"
                  >
                    <h2 className="mb-4 text-center text-lg font-bold">
                      {round.name}
                    </h2>

                    <div className="space-y-6">
                      {round.matches.map(
                        (match) => (
                          <div
                            key={match.id}
                            className="overflow-hidden rounded-lg bg-white shadow"
                          >
                            <div className="border-b px-3 py-2 text-xs text-gray-500">
                              Match{" "}
                              {match.position}
                            </div>

                            <div
                              className={`flex justify-between px-4 py-3 ${
                                match.winnerId ===
                                match.player1Id
                                  ? "font-bold"
                                  : ""
                              }`}
                            >
                              <span>
                                {match.player1
                                  ?.name ||
                                  "TBD"}
                              </span>

                              <span>
                                {match.player1Score ??
                                  "-"}
                              </span>
                            </div>

                            <div className="border-t" />

                            <div
                              className={`flex justify-between px-4 py-3 ${
                                match.winnerId ===
                                match.player2Id
                                  ? "font-bold"
                                  : ""
                              }`}
                            >
                              <span>
                                {match.player2
                                  ?.name ||
                                  "TBD"}
                              </span>

                              <span>
                                {match.player2Score ??
                                  "-"}
                              </span>
                            </div>

                            <div className="border-t bg-gray-50 px-4 py-2 text-center text-xs font-medium text-gray-500">
                              {match.status}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}