import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authorization";
import AdminUsersTable from "./AdminUsersTable";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">
          Manage Users
        </h1>

        <p className="mt-2 text-gray-600">
          Grant or revoke staff and admin access.
        </p>

        <div className="mt-6">
          <AdminUsersTable
            currentUserId={Number(session.user.id)}
          />
        </div>
      </div>
    </main>
  );
}
