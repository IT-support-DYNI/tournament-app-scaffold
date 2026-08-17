"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Tournament = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  registrationOpen: string;
  registrationClose: string | null;
  maxParticipants: number;
  needsContact: boolean;
  drawRule: "DRAW_ALLOWED" | "DRAW_NOT_ALLOWED" | "PENALTY_DECIDES";
};

function formatDateForInput(date: string | null) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationClose, setRegistrationClose] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [needsContact, setNeedsContact] = useState(false);
  const [drawRule, setDrawRule] =
    useState<Tournament["drawRule"]>("DRAW_NOT_ALLOWED");

  useEffect(() => {
    async function loadTournament() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/tournaments/${id}`);

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("Server returned an unexpected response.");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load tournament."
          );
        }

        const tournament: Tournament = data;

        setName(tournament.name);
        setStartDate(formatDateForInput(tournament.startDate));
        setEndDate(formatDateForInput(tournament.endDate));
        setRegistrationOpen(
          formatDateForInput(tournament.registrationOpen)
        );
        setRegistrationClose(
          formatDateForInput(tournament.registrationClose)
        );
        setMaxParticipants(
          String(tournament.maxParticipants)
        );
        setNeedsContact(tournament.needsContact);
        setDrawRule(tournament.drawRule);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tournament."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTournament();
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          startDate,
          endDate: endDate || null,
          registrationOpen,
          registrationClose: registrationClose || null,
          maxParticipants: Number(maxParticipants),
          needsContact,
          drawRule,
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error(
          `Server returned an unexpected response (${response.status}).`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update tournament."
        );
      }

      router.push(`/tournaments/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update tournament."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-600">
            Loading tournament...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back
          </button>

          <h1 className="mt-2 text-3xl font-bold">
            Edit Tournament
          </h1>

          <p className="mt-1 text-gray-600">
            Update the tournament settings below.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament name */}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Tournament Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            {/* Start date */}

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>

              <input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            {/* End date */}

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>

              <input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Optional.
              </p>
            </div>

            {/* Registration open */}

            <div>
              <label
                htmlFor="registrationOpen"
                className="block text-sm font-medium text-gray-700"
              >
                Registration Opens
              </label>

              <input
                id="registrationOpen"
                type="datetime-local"
                value={registrationOpen}
                onChange={(event) =>
                  setRegistrationOpen(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            {/* Registration close */}

            <div>
              <label
                htmlFor="registrationClose"
                className="block text-sm font-medium text-gray-700"
              >
                Registration Closes
              </label>

              <input
                id="registrationClose"
                type="datetime-local"
                value={registrationClose}
                onChange={(event) =>
                  setRegistrationClose(event.target.value)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Optional.
              </p>
            </div>

            {/* Maximum participants */}

            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-gray-700"
              >
                Maximum Participants
              </label>

              <input
                id="maxParticipants"
                type="number"
                min="2"
                value={maxParticipants}
                onChange={(event) =>
                  setMaxParticipants(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            {/* Contact requirement */}

            <div className="rounded-md border border-gray-200 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={needsContact}
                  onChange={(event) =>
                    setNeedsContact(event.target.checked)
                  }
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Require contact information
                </span>
              </label>

              <p className="mt-1 ml-7 text-xs text-gray-500">
                Players will need to provide contact details
                when registering.
              </p>
            </div>

            {/* Draw rule */}

            <div>
              <label
                htmlFor="drawRule"
                className="block text-sm font-medium text-gray-700"
              >
                Draw Rule
              </label>

              <select
                id="drawRule"
                value={drawRule}
                onChange={(event) =>
                  setDrawRule(
                    event.target.value as Tournament["drawRule"]
                  )
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="DRAW_NOT_ALLOWED">
                  Draws Not Allowed
                </option>

                <option value="DRAW_ALLOWED">
                  Draws Allowed
                </option>

                <option value="PENALTY_DECIDES">
                  Penalty Decides
                </option>
              </select>
            </div>

            {/* Buttons */}

            <div className="flex items-center justify-end gap-3 border-t pt-6">
              <button
                type="button"
                onClick={() =>
                  router.push(`/tournaments/${id}`)
                }
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}