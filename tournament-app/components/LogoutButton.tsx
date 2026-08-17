"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    async function handleLogout() {
        await signOut({
            callbackUrl: "/login",
        });
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
        >
            Log out
        </button>
    );
}
