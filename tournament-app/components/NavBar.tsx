import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canCreateTournaments, isAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  const canCreate = Boolean(
    session?.user?.role &&
      canCreateTournaments(session.user.role)
  );

  const admin = Boolean(
    session?.user?.role && isAdmin(session.user.role)
  );

  const unreadCount = session?.user?.id
    ? await prisma.notification.count({
        where: {
          userId: Number(session.user.id),
          read: false,
        },
      })
    : 0;

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold"
        >
          Tournament App
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-700 hover:text-black"
          >
            Home
          </Link>

          <Link
            href="/tournaments"
            className="text-sm text-gray-700 hover:text-black"
          >
            Tournaments
          </Link>

          {canCreate && (
            <Link
              href="/tournaments/new"
              className="text-sm text-gray-700 hover:text-black"
            >
              Create Tournament
            </Link>
          )}

          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-700 hover:text-black"
              >
                Dashboard
              </Link>

              {admin && (
                <Link
                  href="/admin/users"
                  className="text-sm text-gray-700 hover:text-black"
                >
                  Manage Users
                </Link>
              )}

              <Link
                href="/notifications"
                className="relative text-sm text-gray-700 hover:text-black"
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.user.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {session.user.role}
                  </p>
                </div>

                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}