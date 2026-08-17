"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tournamentId: number;
  status: string;
};

const NEXT_STATUS: Record<
  string,
  { label: string; target: string } | undefined
> = {
  DRAFT: {
    label: "Open Registration",
    target: "REGISTRATION_OPEN",
  },
  REGISTRATION_OPEN: {
    label: "Close Registration",
    target: "REGISTRATION_CLOSED",
  },
  REGISTRATION_CLOSED: {
    label: "Reopen Registration",
    target: "REGISTRATION_OPEN",
  },
};

export default function TournamentStatusControls({
  tournamentId,
  status,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = NEXT_STATUS[status];

  if (!next) {
    return null;
  }

  async function handleClick() {
    if (!next) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: next.target,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update tournament status."
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update tournament status."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Updating..." : next.label}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
