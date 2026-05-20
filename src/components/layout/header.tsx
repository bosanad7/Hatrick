"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Search, ChevronDown, LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Role } from "@prisma/client";
import { ROLE_LABELS, ROLE_COLORS, getDashboardPath } from "@/lib/permissions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useTranslation } from "@/lib/i18n";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Map of server-side English titles → translation keys.
 * Since server components can't use useTranslation(), we auto-translate
 * known page titles inside the client Header component.
 */
const TITLE_MAP: Record<string, string> = {
  "Admin Dashboard": "dashboard",
  "Manager Dashboard": "dashboard",
  "Coach Dashboard": "dashboard",
  "Parent Dashboard": "dashboard",
  "Call Center": "call_center",
  "Players": "players",
  "Coaches": "coaches",
  "Training Groups": "groups",
  "Training Schedule": "training_schedule",
  "Payments": "payments",
  "Pitches": "pitches",
  "Announcements": "announcements",
  "Reports & Analytics": "reports",
  "Player Registration": "registration",
  "Subscriptions": "subscriptions",
  "Coupons": "coupons",
  "Merchandise": "merchandise",
  "Best Players of the Month": "best_players",
  "Audit Log": "audit_log",
  "AI Assistant": "ai_title",
  "Notifications": "notifications",
  "Access Denied": "access_denied",
  "Support": "support",
  "Tickets": "tickets",
  "My Children": "my_children",
  "My Sessions": "my_sessions",
  "My Groups": "my_groups",
  "Evaluate Sessions": "evaluate_sessions",
  "Attendance": "attendance",
  "Evaluations": "nav_evaluations",
  "Postpone": "postpone",
  "Shop": "shop",
};

const SUBTITLE_MAP: Record<string, string> = {
  "Full academy overview — all systems": "reports_subtitle",
  "Manage coaching staff and roles": "manage_coaching_staff",
  "Organise players into training groups by age": "groups_subtitle",
  "Availability overview": "pitches_subtitle",
  "Broadcast messages to parents, coaches, and admins": "announcements_subtitle",
  "Academy-wide performance and financial summary": "reports_subtitle",
  "Register new players with smart pricing": "registration_subtitle",
  "Manage player subscriptions & memberships": "subscriptions_subtitle",
  "Manage discount codes": "coupons_subtitle",
  "Support ticket management": "call_center_subtitle",
  "Get help or submit a request": "support_subtitle",
  "Ask anything about your academy": "ai_placeholder",
};

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { t, dir } = useTranslation();
  const [mounted, setMounted]       = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRTL = dir === "rtl";

  useEffect(() => setMounted(true), []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const role = (session?.user as { role?: Role })?.role ?? Role.PARENT;
  const roleColor = ROLE_COLORS[role];
  const roleLabel = ROLE_LABELS[role];
  const userName  = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Auto-translate known titles from server components
  const titleKey = TITLE_MAP[title];
  const subtitleKey = subtitle ? SUBTITLE_MAP[subtitle] : undefined;
  const displayTitle = titleKey ? t(titleKey as Parameters<typeof t>[0]) : title;
  const displaySubtitle = subtitleKey ? t(subtitleKey as Parameters<typeof t>[0]) : subtitle;

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Title */}
      <motion.div
        key={displayTitle}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{displaySubtitle}</p>
        )}
      </motion.div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">

        {/* Expandable search */}
        <motion.div
          animate={{ width: searchOpen ? 200 : 32 }}
          transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}
          className="relative flex items-center overflow-hidden rounded-md"
          style={{ background: searchOpen ? "var(--muted)" : "transparent" }}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {searchOpen && (
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              placeholder={t("search_placeholder")}
              className="h-8 flex-1 bg-transparent pr-3 text-xs outline-none"
              style={{ color: "var(--foreground)" }}
              dir={isRTL ? "rtl" : "ltr"}
            />
          )}
        </motion.div>

        {/* Theme toggle */}
        {mounted && (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark"
                ? <Sun  className="h-3.5 w-3.5" />
                : <Moon className="h-3.5 w-3.5" />
              }
            </motion.div>
          </motion.button>
        )}

        {/* Language toggle */}
        <LanguageToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: "var(--border)" }} />

        {/* Role badge */}
        <span
          className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: roleColor.bg, color: roleColor.text }}
        >
          {roleLabel}
        </span>

        {/* User profile dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors"
            style={{ background: "var(--muted)" }}
          >
            {/* Avatar */}
            <div
              className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ background: "var(--primary)" }}
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold leading-none" style={{ color: "var(--foreground)" }}>
                {userName}
              </p>
              <p
                className="mt-0.5 text-[9px] font-medium uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {role}
              </p>
            </div>
            <ChevronDown
              className="hidden h-2.5 w-2.5 sm:block transition-transform duration-200"
              style={{
                color: "var(--muted-foreground)",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Dropdown panel */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+6px)] z-50 w-56 rounded-xl border shadow-lg overflow-hidden"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  ...(isRTL ? { left: 0 } : { right: 0 }),
                }}
              >
                {/* User info */}
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {userName}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>
                        {userEmail}
                      </p>
                    </div>
                  </div>
                  {/* Role badge inside dropdown */}
                  <span
                    className="mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: roleColor.bg, color: roleColor.text }}
                  >
                    {roleLabel}
                  </span>
                </div>

                {/* Profile link */}
                <div className="py-1">
                  <a
                    href={getDashboardPath(role)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors"
                    style={{ color: "var(--foreground)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                    {t("my_dashboard")}
                  </a>
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: "var(--border)" }} />

                {/* Sign out */}
                <div className="py-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors"
                    style={{ color: "#f87171" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("sign_out")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
