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
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          Notifications
        </h1>

        <p className="mt-2 text-gray-600">
          Updates on tournaments you're registered in.
        </p>

        <div className="mt-6">
          <NotificationsList />
        </div>
      </div>
    </main>
  );
}
