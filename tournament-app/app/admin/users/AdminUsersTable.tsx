"use client";

import { useEffect, useState } from "react";

type Role = "USER" | "STAFF" | "ADMIN";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type Props = {
  currentUserId: number;
};

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  STAFF: "bg-sky-100 text-sky-700",
  USER: "bg-slate-100 text-slate-600",
};

export default function AdminUsersTable({
  currentUserId,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<
    number | null
  >(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/users"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load users."
        );
      }

      setUsers(data.users);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(
    userId: number,
    role: Role
  ) {
    try {
      setUpdatingId(userId);
      setError("");

      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update role."
        );
      }

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update role."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading users...
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error && (
        <div className="border-b border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Name
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Email
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Role
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {user.name}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {user.email}
                </td>

                <td className="px-6 py-4">
                  {user.id === currentUserId ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${ROLE_STYLES[user.role]}`}
                    >
                      {user.role} (you)
                    </span>
                  ) : (
                    <select
                      value={user.role}
                      disabled={
                        updatingId === user.id
                      }
                      onChange={(event) =>
                        changeRole(
                          user.id,
                          event.target
                            .value as Role
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                    >
                      <option value="USER">
                        USER
                      </option>
                      <option value="STAFF">
                        STAFF
                      </option>
                      <option value="ADMIN">
                        ADMIN
                      </option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
