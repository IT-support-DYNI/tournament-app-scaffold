import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import NotificationsList from "./NotificationsList";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Notifications
      </h1>

      <p className="mt-1 text-slate-600">
        Updates on tournaments you're registered in.
      </p>

      <div className="mt-6">
        <NotificationsList />
      </div>
    </main>
  );
}
