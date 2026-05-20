"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, UserCheck, CalendarDays,
  CreditCard, BarChart3, Megaphone, MapPin,
  ClipboardList, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Baby, BookOpen, CheckSquare, Bell, ShieldCheck,
  Headphones, MessageSquare, TicketCheck,
  UserPlus, Tag, Package, FileText, Clock, Trophy, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Role } from "@prisma/client";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ElementType;
  badge?: TranslationKey;
  exact?: boolean;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  [Role.ADMIN]: [
    { href: "/dashboard/admin",         labelKey: "nav_dashboard",     icon: LayoutDashboard, exact: true },
    { href: "/dashboard/players",       labelKey: "nav_players",       icon: Users            },
    { href: "/dashboard/coaches",       labelKey: "nav_coaches",       icon: UserCheck        },
    { href: "/dashboard/groups",        labelKey: "nav_groups",        icon: ClipboardList    },
    { href: "/dashboard/schedule",      labelKey: "nav_schedule",      icon: CalendarDays     },
    { href: "/dashboard/pitches",       labelKey: "nav_pitches",       icon: MapPin           },
    { href: "/dashboard/payments",      labelKey: "nav_payments",      icon: CreditCard       },
    { href: "/dashboard/reports",       labelKey: "nav_reports",       icon: BarChart3        },
    { href: "/dashboard/registration",   labelKey: "nav_registration",  icon: UserPlus         },
    { href: "/dashboard/subscriptions",  labelKey: "nav_subscriptions", icon: FileText         },
    { href: "/dashboard/coupons",        labelKey: "nav_coupons",       icon: Tag              },
    { href: "/dashboard/merchandise",    labelKey: "nav_merchandise",   icon: Package          },
    { href: "/dashboard/announcements",  labelKey: "nav_announcements", icon: Megaphone        },
    { href: "/dashboard/admin/best-players", labelKey: "nav_best_players", icon: Trophy },
    { href: "/dashboard/admin/audit-log",   labelKey: "nav_audit_log",    icon: ScrollText },
    { href: "/dashboard/ai",             labelKey: "nav_ai_assistant",  icon: Sparkles, badge: "new_badge" },
  ],
  [Role.MANAGER]: [
    { href: "/dashboard/manager",              labelKey: "nav_dashboard",     icon: LayoutDashboard, exact: true },
    { href: "/dashboard/manager/players",      labelKey: "nav_players",       icon: Users            },
    { href: "/dashboard/manager/coaches",      labelKey: "nav_coaches",       icon: UserCheck        },
    { href: "/dashboard/manager/groups",       labelKey: "nav_groups",        icon: ClipboardList    },
    { href: "/dashboard/manager/schedule",     labelKey: "nav_schedule",      icon: CalendarDays     },
    { href: "/dashboard/manager/payments",     labelKey: "nav_payments",      icon: CreditCard       },
    { href: "/dashboard/subscriptions",        labelKey: "nav_subscriptions", icon: FileText         },
    { href: "/dashboard/manager/reports",      labelKey: "nav_reports",       icon: BarChart3        },
    { href: "/dashboard/manager/announcements",labelKey: "nav_announcements", icon: Megaphone        },
  ],
  [Role.COACH]: [
    { href: "/dashboard/coach",               labelKey: "nav_dashboard",    icon: LayoutDashboard, exact: true },
    { href: "/dashboard/coach/sessions",      labelKey: "nav_my_sessions",  icon: CalendarDays     },
    { href: "/dashboard/coach/groups",        labelKey: "nav_my_groups",    icon: ClipboardList    },
    { href: "/dashboard/coach/evaluate",     labelKey: "nav_evaluate",     icon: ClipboardList, badge: "new_badge" },
    { href: "/dashboard/coach/attendance",    labelKey: "nav_attendance",   icon: CheckSquare      },
    { href: "/dashboard/coach/notes",         labelKey: "nav_evaluations",  icon: BookOpen         },
    { href: "/dashboard/coach/announcements", labelKey: "nav_announcements",icon: Megaphone        },
  ],
  [Role.PARENT]: [
    { href: "/dashboard/parent",               labelKey: "nav_dashboard",      icon: LayoutDashboard, exact: true },
    { href: "/dashboard/parent/children",      labelKey: "nav_my_children",    icon: Baby             },
    { href: "/dashboard/parent/schedule",      labelKey: "nav_schedule",       icon: CalendarDays     },
    { href: "/dashboard/parent/attendance",    labelKey: "nav_attendance",     icon: CheckSquare      },
    { href: "/dashboard/parent/postpone",      labelKey: "nav_postpone",       icon: Clock            },
    { href: "/dashboard/parent/payments",      labelKey: "nav_payments",       icon: CreditCard       },
    { href: "/dashboard/parent/shop",          labelKey: "nav_shop",           icon: Package          },
    { href: "/dashboard/parent/support",       labelKey: "nav_support",        icon: Headphones       },
    { href: "/dashboard/parent/announcements", labelKey: "nav_announcements",  icon: Bell             },
  ],
  [Role.CALL_CENTER]: [
    { href: "/dashboard/call-center",          labelKey: "nav_dashboard",    icon: LayoutDashboard, exact: true },
    { href: "/dashboard/call-center/tickets",  labelKey: "nav_tickets",      icon: TicketCheck      },
    { href: "/dashboard/call-center/messages",  labelKey: "nav_messages",     icon: MessageSquare    },
  ],
};

interface SidebarProps {
  role: Role;
  userName?: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t, dir } = useTranslation();
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS[Role.PARENT];
  const roleColor = ROLE_COLORS[role];
  const isRTL = dir === "rtl";

  const accentColor = "#ffffff";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-screen flex-col overflow-hidden border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        flexShrink: 0,
        borderRight: isRTL ? "none" : undefined,
        borderLeft: isRTL ? "1px solid var(--sidebar-border)" : undefined,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accentColor }} />

      {/* Logo */}
      <div className="flex h-14 items-center border-b px-3" style={{ borderColor: "var(--sidebar-border)" }}>
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div key="dot" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}
              className="flex h-8 w-8 items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="logo" initial={{ opacity: 0, x: isRTL ? 8 : -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 8 : -8 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <Image src="/hattrick-logo.webp" alt="Hattrick" width={110} height={14} className="logo-invert" priority />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute z-20 flex h-5 w-5 items-center justify-center rounded-full border transition-all hover:scale-110"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
          top: "3.5rem",
          ...(isRTL ? { left: "-0.625rem" } : { right: "-0.625rem" }),
        }}>
        {isRTL
          ? (collapsed ? <ChevronLeft className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />)
          : (collapsed ? <ChevronRight className="h-2.5 w-2.5" /> : <ChevronLeft className="h-2.5 w-2.5" />)
        }
      </button>

      {/* Role badge */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden px-3 pt-2.5 pb-1">
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: roleColor.bg, color: roleColor.text }}>
              <ShieldCheck className="h-2.5 w-2.5" />
              {ROLE_LABELS[role]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        <ul className="space-y-0.5">
          {navItems.map(({ href, labelKey, icon: Icon, badge, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link href={href}>
                  <motion.div whileHover={{ x: collapsed ? 0 : (isRTL ? -3 : 3) }} whileTap={{ scale: 0.97 }}
                    className={cn("nav-active-bar relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors")}
                    style={{ background: active ? "var(--sidebar-item-active-bg)" : "transparent", color: active ? "var(--sidebar-item-active-text)" : "var(--sidebar-item-text)" }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-item-text)"; } }}
                  >
                    {active && (
                      <motion.div layoutId="sidebarActive"
                        className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r"
                        style={{
                          background: accentColor,
                          ...(isRTL ? { right: 0, borderRadius: "2px 0 0 2px" } : { left: 0 }),
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: active ? "#fff" : "var(--sidebar-item-text)" }} />
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                          className="overflow-hidden whitespace-nowrap">
                          {t(labelKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && badge && (
                      <span className={`${isRTL ? "mr-auto" : "ml-auto"} rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide`}
                        style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{t(badge)}</span>
                    )}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t p-2" style={{ borderColor: "var(--sidebar-border)" }}>
        <AnimatePresence initial={false}>
          {!collapsed && userName && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="mb-1 overflow-hidden px-2.5 py-1">
              <p className="truncate text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{userName}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ x: collapsed ? 0 : (isRTL ? -2 : 2) }} whileTap={{ scale: 0.97 }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors"
          style={{ color: "var(--sidebar-item-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-item-text)"; }}>
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap">{t("sign_out")}</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
