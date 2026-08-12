"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTournamentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationClose, setRegistrationClose] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [needsContact, setNeedsContact] = useState(false);
  const [drawRule, setDrawRule] = useState("DRAW_NOT_ALLOWED");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create tournament.");
        return;
      }

      router.push(`/tournaments/${data.id}`);
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Create Tournament
          </h1>

          <p className="mt-2 text-gray-600">
            Set up your tournament and registration settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-8 shadow"
        >
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tournament name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Tournament Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Summer Championship 2026"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          {/* Start date */}
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium"
            >
              Tournament Start
            </label>

            <input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* End date */}
          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium"
            >
              Tournament End
            </label>

            <input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Optional.
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold">
              Registration Settings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control when players can register.
            </p>
          </div>

          {/* Registration open */}
          <div>
            <label
              htmlFor="registrationOpen"
              className="mb-2 block text-sm font-medium"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Registration close */}
          <div>
            <label
              htmlFor="registrationClose"
              className="mb-2 block text-sm font-medium"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Optional.
            </p>
          </div>

          {/* Maximum participants */}
          <div>
            <label
              htmlFor="maxParticipants"
              className="mb-2 block text-sm font-medium"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Contact requirement */}
          <div className="rounded-md border border-gray-200 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={needsContact}
                onChange={(event) =>
                  setNeedsContact(event.target.checked)
                }
                className="h-4 w-4"
              />

              <div>
                <p className="text-sm font-medium">
                  Require contact details
                </p>

                <p className="text-xs text-gray-500">
                  Require players to provide contact information
                  when registering.
                </p>
              </div>
            </label>
          </div>

          {/* Draw rule */}
          <div>
            <label
              htmlFor="drawRule"
              className="mb-2 block text-sm font-medium"
            >
              Draw Rule
            </label>

            <select
              id="drawRule"
              value={drawRule}
              onChange={(event) =>
                setDrawRule(event.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="DRAW_NOT_ALLOWED">
                Draws Not Allowed
              </option>

              <option value="DRAW_ALLOWED">
                Draws Allowed
              </option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => router.push("/tournaments")}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Tournament"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}