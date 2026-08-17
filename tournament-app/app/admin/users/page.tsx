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
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Manage Users
      </h1>

      <p className="mt-1 text-slate-600">
        Grant or revoke staff and admin access.
      </p>

      <div className="mt-6">
        <AdminUsersTable
          currentUserId={Number(session.user.id)}
        />
      </div>
    </main>
  );
}
