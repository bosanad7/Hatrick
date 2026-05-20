"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { t, dir } = useTranslation();
  const isRTL = dir === "rtl";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("just_now");
    if (mins < 60) return t("minutes_ago", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("hours_ago", { n: hrs });
    const days = Math.floor(hrs / 24);
    return t("days_ago", { n: days });
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-bold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+6px)] z-50 w-80 rounded-xl border shadow-lg overflow-hidden"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              ...(isRTL ? { left: 0 } : { right: 0 }),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                {t("notifications")} {unreadCount > 0 && `(${unreadCount})`}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-medium transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Check className="h-3 w-3" /> {t("mark_all_read")}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto mb-2 h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("no_notifications")}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="border-b px-4 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                    style={{
                      borderColor: "var(--border)",
                      background: n.isRead ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
                      )}
                      <div className={n.isRead ? (isRTL ? "pr-3.5" : "pl-3.5") : ""}>
                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{n.title}</p>
                        <p className="mt-0.5 text-[11px] line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{n.body}</p>
                        <p className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
              <div className="border-t px-4 py-2 text-center transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>{t("view_all_notifications")}</p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
