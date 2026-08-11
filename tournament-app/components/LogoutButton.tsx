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
            className="rounded-md border border-grey-300 px-4 py-2 text-sm font-medium hover:bg-grey-100"
        >
            Log out
        </button>
    );
}
