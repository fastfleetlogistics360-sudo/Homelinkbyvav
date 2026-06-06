"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationsReadAction } from "@/lib/actions/notifications";

export type DashboardNotification = {
  notification_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function DashboardNotifications({
  notifications,
  returnTo
}: {
  notifications: DashboardNotification[];
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="dashboard-notification-wrap" ref={wrapRef}>
      <button
        aria-expanded={open}
        aria-label="Notifications"
        className="dashboard-bell"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell size={28} />
        {unreadCount ? <span /> : null}
      </button>

      {open ? (
        <div className="dashboard-notification-menu" role="dialog" aria-label="Notifications">
          <div>
            <strong>Notifications</strong>
            {unreadCount ? <em>{unreadCount} new</em> : <em>All caught up</em>}
          </div>
          {notifications.length ? (
            <ul>
              {notifications.map((notification) => (
                <li className={notification.read ? "read" : ""} key={notification.notification_id}>
                  <span>{notification.type.replaceAll("_", " ")}</span>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notification-empty">No notifications yet.</p>
          )}
          {unreadCount ? (
            <form action={markNotificationsReadAction}>
              <input name="return_to" type="hidden" value={returnTo} />
              <button type="submit">
                <CheckCheck size={18} />
                Mark all read
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
