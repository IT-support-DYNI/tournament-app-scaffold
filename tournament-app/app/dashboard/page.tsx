import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Welcome, {session.user.name}
          </h2>

          <div className="mt-4 space-y-2 text-gray-600">
            <p>
              <strong>Email:</strong>{" "}
              {session.user.email}
            </p>

            <p>
              <strong>User ID:</strong>{" "}
              {session.user.id}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {session.user.role}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}