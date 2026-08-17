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
      <p className="text-gray-600">
        Loading users...
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      {error && (
        <div className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Name
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Email
              </th>

              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Role
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-medium">
                  {user.name}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>

                <td className="px-6 py-4">
                  {user.id === currentUserId ? (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
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
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
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
