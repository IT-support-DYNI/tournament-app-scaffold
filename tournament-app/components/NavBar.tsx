import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canCreateTournaments, isAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  STAFF: "bg-sky-100 text-sky-700",
  USER: "bg-slate-100 text-slate-600",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const navLinkClass =
    "rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg shadow-sm shadow-emerald-500/30">
            🏆
          </span>

          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Tournament<span className="text-emerald-600">App</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>

          <Link href="/tournaments" className={navLinkClass}>
            Tournaments
          </Link>

          {canCreate && (
            <Link
              href="/tournaments/new"
              className={navLinkClass}
            >
              Create Tournament
            </Link>
          )}

          {admin && (
            <Link
              href="/admin/users"
              className={navLinkClass}
            >
              Manage Users
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
                  {initials(session.user.name ?? "?")}
                </span>

                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {session.user.name}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                    ROLE_STYLES[session.user.role] ??
                    ROLE_STYLES.USER
                  }`}
                >
                  {session.user.role}
                </span>
              </div>

              <LogoutButton />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 transition hover:shadow-md hover:shadow-emerald-500/40"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
