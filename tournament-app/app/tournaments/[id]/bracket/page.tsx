import Link from "next/link";

import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

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
        champion: true,
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
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}

      <div className="mb-8">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to Tournament
        </Link>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          {tournament.name}
        </h1>

        <p className="mt-1 text-slate-600">
          Tournament Bracket
        </p>
      </div>

      {/* Champion */}

      {tournament.status === "COMPLETED" &&
        tournament.champion && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
              🏆 Champion
            </p>

            <p className="mt-1 text-3xl font-extrabold text-amber-900">
              {tournament.champion.name}
            </p>
          </div>
        )}

      {/* No bracket */}

      {tournament.rounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Bracket has not been generated
          </h2>

          <p className="mt-1 text-slate-500">
            Generate the bracket once enough
            participants have been approved.
          </p>

          <Link
            href={`/tournaments/${tournament.id}`}
            className="mt-5 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Tournament
          </Link>
        </div>
      ) : (
        /* Bracket */

        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-10">
            {tournament.rounds.map((round) => (
              <div key={round.id} className="w-64">
                {/* Round title */}

                <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-slate-500">
                  {round.name}
                </h2>

                {/* Matches */}

                <div className="space-y-5">
                  {round.matches.map((match) => (
                    /*
                     * Clicking a match opens
                     * the match management page.
                     */
                    <Link
                      key={match.id}
                      href={`/tournaments/${tournament.id}/matches/${match.id}`}
                      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                    >
                      {/* Match header */}

                      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2">
                        <span className="text-xs font-semibold text-slate-400">
                          Match {match.position}
                        </span>

                        <StatusBadge status={match.status} />
                      </div>

                      {/* Player 1 */}

                      <PlayerRow
                        name={match.player1?.name}
                        score={match.player1Score}
                        isWinner={
                          match.winnerId ===
                            match.player1Id &&
                          match.player1Id !== null
                        }
                      />

                      {/* Divider */}

                      <div className="border-t border-slate-100" />

                      {/* Player 2 */}

                      <PlayerRow
                        name={match.player2?.name}
                        score={match.player2Score}
                        isWinner={
                          match.winnerId ===
                            match.player2Id &&
                          match.player2Id !== null
                        }
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function PlayerRow({
  name,
  score,
  isWinner,
}: {
  name: string | undefined;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-3 ${
        isWinner ? "bg-emerald-50" : ""
      }`}
    >
      <span
        className={`truncate text-sm ${
          isWinner
            ? "font-bold text-emerald-800"
            : name
              ? "text-slate-700"
              : "text-slate-400"
        }`}
      >
        {isWinner && "🏅 "}
        {name || "TBD"}
      </span>

      <span
        className={`text-sm ${
          isWinner
            ? "font-bold text-emerald-800"
            : "text-slate-400"
        }`}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}
