"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RegisterTournamentPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [club, setClub] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            age: Number(age),
            club,
            email,
            phone,
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
            "Failed to submit registration."
        );
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit registration."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h1 className="text-2xl font-bold">
              Registration Submitted
            </h1>

            <p className="mt-3 text-gray-600">
              Your registration has been submitted
              successfully.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Your registration is currently pending
              approval.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(`/tournaments/${id}`)
              }
              className="mt-6 rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Tournament
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <h1 className="mt-3 text-3xl font-bold">
          Register for Tournament
        </h1>

        <p className="mt-2 text-gray-600">
          Enter your details below to register.
        </p>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name *
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700"
              >
                Age *
              </label>

              <input
                id="age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(event) =>
                  setAge(event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="club"
                className="block text-sm font-medium text-gray-700"
              >
                Club
              </label>

              <input
                id="club"
                type="text"
                value={club}
                onChange={(event) =>
                  setClub(event.target.value)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}