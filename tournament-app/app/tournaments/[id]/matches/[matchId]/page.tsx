"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Participant = {
  id: number;
  name: string;
};

type Match = {
  id: number;
  position: number;
  status: string;

  player1Score: number | null;
  player2Score: number | null;

  player1PenaltyScore: number | null;
  player2PenaltyScore: number | null;

  resultType?: string | null;
  winnerId?: number | null;

  player1: Participant | null;
  player2: Participant | null;

  round: {
    name: string;
    roundNumber: number;
  };
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();

  const tournamentId = String(params.id);
  const matchId = String(params.matchId);

  const [match, setMatch] = useState<Match | null>(
    null
  );

  const [player1Score, setPlayer1Score] =
    useState("");

  const [player2Score, setPlayer2Score] =
    useState("");

  const [player1PenaltyScore, setPlayer1PenaltyScore] =
    useState("");

  const [player2PenaltyScore, setPlayer2PenaltyScore] =
    useState("");

  const [resultType, setResultType] =
    useState("NORMAL");

  const [winnerId, setWinnerId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  async function loadMatch() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}`
      );

      const contentType =
        response.headers.get("content-type");

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load tournament."
        );
      }

      const foundMatch =
        data.matches?.find(
          (item: Match) =>
            item.id === Number(matchId)
        );

      if (!foundMatch) {
        throw new Error(
          "Match not found."
        );
      }

      setMatch(foundMatch);

      // Load existing result data if this match
      // already has a result.
      setPlayer1Score(
        foundMatch.player1Score != null
          ? String(foundMatch.player1Score)
          : ""
      );

      setPlayer2Score(
        foundMatch.player2Score != null
          ? String(foundMatch.player2Score)
          : ""
      );

      setPlayer1PenaltyScore(
        foundMatch.player1PenaltyScore != null
          ? String(
              foundMatch.player1PenaltyScore
            )
          : ""
      );

      setPlayer2PenaltyScore(
        foundMatch.player2PenaltyScore != null
          ? String(
              foundMatch.player2PenaltyScore
            )
          : ""
      );

      if (foundMatch.resultType) {
        setResultType(
          foundMatch.resultType
        );
      }

      if (foundMatch.winnerId != null) {
        setWinnerId(
          String(foundMatch.winnerId)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load match."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatch();
  }, [tournamentId, matchId]);

  async function submitResult(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!match) {
      return;
    }

    // A normal match requires two players.
    if (
      !match.player1 ||
      !match.player2
    ) {
      setError(
        "Both players must be assigned before submitting a result."
      );

      return;
    }

    // Normal / penalty results require scores.
    if (
      resultType === "NORMAL" ||
      resultType === "PENALTY"
    ) {
      if (
        player1Score === "" ||
        player2Score === ""
      ) {
        setError(
          "Please enter both player scores."
        );

        return;
      }
    }

    // Draw requires both scores but no winner.
    if (resultType === "DRAW") {
      if (
        player1Score === "" ||
        player2Score === ""
      ) {
        setError(
          "Please enter both player scores for a draw."
        );

        return;
      }

      if (
        Number(player1Score) !==
        Number(player2Score)
      ) {
        setError(
          "A draw requires equal scores."
        );

        return;
      }
    }

    // Walkover requires a winner.
    if (
      resultType === "WALKOVER" &&
      !winnerId
    ) {
      setError(
        "Please select the walkover winner."
      );

      return;
    }

    const isCorrection =
      match.status === "COMPLETED";

    if (isCorrection) {
      const confirmed = window.confirm(
        "This match has already been completed. Resubmitting will overwrite the result and may reset any later rounds that were built on the previous winner. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}/matches/${matchId}/result`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            confirmCorrection: isCorrection,
            player1Score:
              player1Score === ""
                ? null
                : Number(player1Score),

            player2Score:
              player2Score === ""
                ? null
                : Number(player2Score),

            player1PenaltyScore:
              player1PenaltyScore === ""
                ? null
                : Number(
                    player1PenaltyScore
                  ),

            player2PenaltyScore:
              player2PenaltyScore === ""
                ? null
                : Number(
                    player2PenaltyScore
                  ),

            resultType,

            winnerId:
              winnerId === ""
                ? null
                : Number(winnerId),
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to submit result."
        );
      }

      router.push(
        `/tournaments/${tournamentId}/bracket`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit result."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        Loading match...
      </main>
    );
  }

  if (!match) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Match not found
        </h1>

        <p className="mt-2 text-red-600">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/tournaments/${tournamentId}/bracket`}
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back to bracket
        </Link>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          {/* Match header */}

          <div className="mb-6">
            <p className="text-sm text-gray-500">
              {match.round.name}
            </p>

            <h1 className="text-2xl font-bold">
              Match {match.position}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Status: {match.status}
            </p>
          </div>

          {/* Error */}

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {match.status === "COMPLETED" && (
            <div className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
              This match is already completed. Submitting
              a new result will correct it and may reset
              any later rounds that were built on the
              previous winner.
            </div>
          )}

          {match.status !== "COMPLETED" &&
            match.resultType === "DRAW" && (
              <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                This match ended in a draw and needs a
                replay. Submit a decisive result below —
                or select Draw again if it's still tied.
              </div>
            )}

          {/* Result form */}

          <form
            onSubmit={submitResult}
            className="space-y-6"
          >
            {/* Player 1 */}

            <div className="rounded-lg border p-4">
              <label className="block text-sm font-medium">
                {match.player1?.name ??
                  "Player 1"}
              </label>

              <input
                type="number"
                min="0"
                value={player1Score}
                onChange={(event) =>
                  setPlayer1Score(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-md border px-3 py-2"
                placeholder="Score"
                disabled={
                  resultType === "WALKOVER"
                }
              />
            </div>

            {/* Player 2 */}

            <div className="rounded-lg border p-4">
              <label className="block text-sm font-medium">
                {match.player2?.name ??
                  "Player 2"}
              </label>

              <input
                type="number"
                min="0"
                value={player2Score}
                onChange={(event) =>
                  setPlayer2Score(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-md border px-3 py-2"
                placeholder="Score"
                disabled={
                  resultType === "WALKOVER"
                }
              />
            </div>

            {/* Result type */}

            <div>
              <label className="block text-sm font-medium">
                Result type
              </label>

              <select
                value={resultType}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setResultType(value);

                  // Clear winner when switching
                  // away from walkover/penalty.
                  if (
                    value !==
                      "WALKOVER" &&
                    value !== "PENALTY"
                  ) {
                    setWinnerId("");
                  }
                }}
                className="mt-2 w-full rounded-md border px-3 py-2"
              >
                <option value="NORMAL">
                  Normal
                </option>

                <option value="DRAW">
                  Draw
                </option>

                <option value="WALKOVER">
                  Walkover
                </option>

                <option value="PENALTY">
                  Penalty
                </option>
              </select>
            </div>

            {/* Winner */}

            {(resultType ===
              "WALKOVER" ||
              resultType ===
                "PENALTY") && (
              <div>
                <label className="block text-sm font-medium">
                  Winner
                </label>

                <select
                  value={winnerId}
                  onChange={(event) =>
                    setWinnerId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-md border px-3 py-2"
                  required
                >
                  <option value="">
                    Select winner
                  </option>

                  {match.player1 && (
                    <option
                      value={
                        match.player1.id
                      }
                    >
                      {match.player1.name}
                    </option>
                  )}

                  {match.player2 && (
                    <option
                      value={
                        match.player2.id
                      }
                    >
                      {match.player2.name}
                    </option>
                  )}
                </select>
              </div>
            )}

            {/* Penalty scores */}

            {resultType ===
              "PENALTY" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    {
                      match.player1
                        ?.name
                    }{" "}
                    penalties
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      player1PenaltyScore
                    }
                    onChange={(event) =>
                      setPlayer1PenaltyScore(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-md border px-3 py-2"
                    placeholder="Penalty score"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    {
                      match.player2
                        ?.name
                    }{" "}
                    penalties
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      player2PenaltyScore
                    }
                    onChange={(event) =>
                      setPlayer2PenaltyScore(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-md border px-3 py-2"
                    placeholder="Penalty score"
                  />
                </div>
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : match.status === "COMPLETED"
                  ? "Correct Result"
                  : "Submit Result"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}