"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import StatusBadge from "@/components/StatusBadge";

type RegistrationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

type Registration = {
  id: number;
  name: string;
  age: number;
  club: string | null;
  email: string | null;
  phone: string | null;
  status: RegistrationStatus;
  createdAt: string;
  participant: {
    id: number;
    status: "ACTIVE" | "INACTIVE" | "ELIMINATED" | "BANNED";
  } | null;
};

type FilterStatus = "ALL" | RegistrationStatus;

export default function TournamentRegistrationsPage() {
  const params = useParams();

  const tournamentId = params.id as string;

  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [filter, setFilter] =
    useState<FilterStatus>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  async function loadRegistrations() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}/registrations`
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
            "Failed to load registrations."
        );
      }

      setRegistrations(data.registrations);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load registrations."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, [tournamentId]);

  async function updateRegistration(
    registrationId: number,
    status: "APPROVED" | "REJECTED"
  ) {
    const action =
      status === "APPROVED"
        ? "approve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this registration?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(registrationId);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}/registrations/${registrationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
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
            `Failed to ${action} registration.`
        );
      }

      await loadRegistrations();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} registration.`
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function withdrawParticipant(
    participantId: number,
    playerName: string
  ) {
    const confirmed = window.confirm(
      `Withdraw ${playerName} from the tournament? If they currently have an assigned opponent, that opponent will immediately advance by walkover.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(participantId);
      setError("");

      const response = await fetch(
        `/api/tournaments/${tournamentId}/participants/${participantId}/withdraw`,
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
            "Failed to withdraw participant."
        );
      }

      await loadRegistrations();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to withdraw participant."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRegistrations =
    filter === "ALL"
      ? registrations
      : registrations.filter(
          (registration) =>
            registration.status === filter
        );

  const pendingCount = registrations.filter(
    (registration) =>
      registration.status === "PENDING"
  ).length;

  const approvedCount = registrations.filter(
    (registration) =>
      registration.status === "APPROVED"
  ).length;

  const rejectedCount = registrations.filter(
    (registration) =>
      registration.status === "REJECTED"
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <a
          href={`/tournaments/${tournamentId}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to Tournament
        </a>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Tournament Registrations
        </h1>

        <p className="mt-1 text-slate-600">
          Review and manage player registrations.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Statistics */}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-500">
            All Registrations
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {registrations.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("PENDING")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-500">
            Pending
          </p>

          <p className="mt-1 text-2xl font-extrabold text-amber-600">
            {pendingCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("APPROVED")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-1 text-2xl font-extrabold text-emerald-600">
            {approvedCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("REJECTED")}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm text-slate-500">
            Rejected
          </p>

          <p className="mt-1 text-2xl font-extrabold text-rose-600">
            {rejectedCount}
          </p>
        </button>
      </div>

      {/* Filter */}

      <div className="mb-4 flex gap-2">
        {(
          [
            "ALL",
            "PENDING",
            "APPROVED",
            "REJECTED",
          ] as FilterStatus[]
        ).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === status
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
            }`}
          >
            {status === "ALL"
              ? "All"
              : status}
          </button>
        ))}
      </div>

      {/* Registrations */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No registrations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Player
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Age
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Club
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Contact
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map(
                    (registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium">
                            {registration.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Registered{" "}
                            {new Date(
                              registration.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {registration.age}
                        </td>

                        <td className="px-6 py-4">
                          {registration.club || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm">
                          <div>
                            {registration.email || "—"}
                          </div>

                          <div className="text-slate-500">
                            {registration.phone || ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={registration.status}
                          />
                        </td>

                        <td className="px-6 py-4 text-right">
                          {registration.status ===
                            "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  registration.id
                                }
                                onClick={() =>
                                  updateRegistration(
                                    registration.id,
                                    "APPROVED"
                                  )
                                }
                                className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  registration.id
                                }
                                onClick={() =>
                                  updateRegistration(
                                    registration.id,
                                    "REJECTED"
                                  )
                                }
                                className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {registration.status ===
                            "APPROVED" &&
                            registration.participant &&
                            registration.participant
                              .status === "ACTIVE" && (
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  registration.participant
                                    .id
                                }
                                onClick={() =>
                                  withdrawParticipant(
                                    registration
                                      .participant!.id,
                                    registration.name
                                  )
                                }
                                className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                              >
                                Withdraw
                              </button>
                            )}

                          {registration.status ===
                            "APPROVED" &&
                            registration.participant &&
                            registration.participant
                              .status !== "ACTIVE" && (
                              <span className="text-sm text-slate-500">
                                Withdrawn
                              </span>
                            )}

                          {registration.status ===
                            "REJECTED" && (
                            <span className="text-sm text-slate-500">
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </main>
  );
}