"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/notifications"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load notifications."
        );
      }

      setNotifications(data.notifications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(notificationId: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId }),
    });
  }

  async function markAllRead() {
    try {
      setMarkingAll(true);

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  if (loading) {
    return (
      <p className="text-gray-600">
        Loading notifications...
      </p>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
          No notifications yet.
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg bg-white shadow">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              onClick={() =>
                !notification.read &&
                markRead(notification.id)
              }
              className={`flex items-start justify-between gap-4 border-b p-4 text-sm last:border-0 ${
                notification.read
                  ? "text-gray-500"
                  : "cursor-pointer bg-blue-50 font-medium text-gray-900"
              }`}
            >
              <span>{notification.message}</span>

              <span className="whitespace-nowrap text-xs text-gray-400">
                {new Date(
                  notification.createdAt
                ).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
