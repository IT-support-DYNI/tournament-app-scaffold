"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tournamentId: number;
};

export default function GenerateBracketButton({
  tournamentId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function generateBracket() {
    const confirmed = window.confirm(
      "Generate the tournament bracket? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}/bracket`,
        {
          method: "POST",
        }
      );

      const contentType =
        response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error(
          `Server returned an unexpected response (${response.status}).`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate bracket."
        );
      }

      router.push(
        `/tournaments/${tournamentId}/bracket`
      );

      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate bracket."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={generateBracket}
        disabled={loading}
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {loading
          ? "Generating..."
          : "Generate Bracket"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}