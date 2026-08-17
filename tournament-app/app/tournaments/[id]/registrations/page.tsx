"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <a
            href={`/tournaments/${tournamentId}`}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Tournament
          </a>

          <h1 className="mt-2 text-3xl font-bold">
            Tournament Registrations
          </h1>

          <p className="mt-1 text-gray-600">
            Review and manage player registrations.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistics */}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className="rounded-lg bg-white p-5 text-left shadow hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">
              All Registrations
            </p>

            <p className="mt-1 text-2xl font-bold">
              {registrations.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className="rounded-lg bg-white p-5 text-left shadow hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">
              Pending
            </p>

            <p className="mt-1 text-2xl font-bold">
              {pendingCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilter("APPROVED")}
            className="rounded-lg bg-white p-5 text-left shadow hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">
              Approved
            </p>

            <p className="mt-1 text-2xl font-bold">
              {approvedCount}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFilter("REJECTED")}
            className="rounded-lg bg-white p-5 text-left shadow hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">
              Rejected
            </p>

            <p className="mt-1 text-2xl font-bold">
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
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                filter === status
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status === "ALL"
                ? "All"
                : status}
            </button>
          ))}
        </div>

        {/* Registrations */}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading registrations...
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No registrations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Player
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Age
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Club
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Contact
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredRegistrations.map(
                    (registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium">
                            {registration.name}
                          </p>

                          <p className="text-xs text-gray-500">
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

                          <div className="text-gray-500">
                            {registration.phone || ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              registration.status ===
                              "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : registration.status ===
                                    "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {registration.status}
                          </span>
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
                                className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
                                className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
                                className="rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                              >
                                Withdraw
                              </button>
                            )}

                          {registration.status ===
                            "APPROVED" &&
                            registration.participant &&
                            registration.participant
                              .status !== "ACTIVE" && (
                              <span className="text-sm text-gray-500">
                                Withdrawn
                              </span>
                            )}

                          {registration.status ===
                            "REJECTED" && (
                            <span className="text-sm text-gray-500">
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
      </div>
    </main>
  );
}