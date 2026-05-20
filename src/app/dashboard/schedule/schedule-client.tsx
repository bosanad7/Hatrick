"use client";

import { useTranslation } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Clock, MapPin, Users, User } from "lucide-react";
import Link from "next/link";
import type { SessionStatus } from "@prisma/client";

const statusVariant: Record<string, string> = {
  SCHEDULED: "bg-[rgba(255,255,255,0.1)] text-[#cccccc]",
  COMPLETED: "bg-[rgba(16,185,129,0.15)] text-emerald-400",
  CANCELLED: "bg-[rgba(239,68,68,0.15)] text-red-400",
};

interface SessionRow {
  id: string;
  title: string;
  notes: string | null;
  status: SessionStatus;
  dateStr: string;
  timeRange: string;
  groupName: string;
  ageGroup: string;
  coachName: string;
  coachRole: string;
  pitchLabel: string;
}

interface ScheduleClientProps {
  sessions: SessionRow[];
  params: { status?: string; date?: string };
  statusValues: string[];
}

const statusKey: Record<string, string> = {
  SCHEDULED: "session_scheduled",
  COMPLETED: "session_completed",
  CANCELLED: "session_cancelled",
};

export function ScheduleClient({ sessions, params, statusValues }: ScheduleClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Training Schedule"
        subtitle={t("sessions_found", { n: sessions.length })}
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                name="date"
                type="date"
                defaultValue={params.date}
                className="h-10 rounded-lg border border-input bg-[var(--card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status}
              className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("all_statuses")}</option>
              {statusValues.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              {t("filter")}
            </Button>
            {(params.status || params.date) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/schedule">{t("clear")}</Link>
              </Button>
            )}
          </form>

          <Button asChild>
            <Link href="/dashboard/schedule/new">
              <Plus className="h-4 w-4" />
              {t("add_session")}
            </Link>
          </Button>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">{t("session")}</th>
                    <th className="px-4 py-3">{t("date_time")}</th>
                    <th className="px-4 py-3">{t("group")}</th>
                    <th className="px-4 py-3">{t("coach")}</th>
                    <th className="px-4 py-3">{t("pitch")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                        {t("no_sessions_found")}
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--foreground)]">{s.title}</p>
                          {s.notes && (
                            <p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs">
                              {s.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                            <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{s.dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span className="text-xs">{s.timeRange}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                            <Users className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{s.groupName}</span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] ml-5">
                            {s.ageGroup}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                            <User className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{s.coachName}</span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] ml-5">
                            {s.coachRole}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                            <MapPin className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{s.pitchLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusVariant[s.status]}`}
                          >
                            {t((statusKey[s.status] ?? s.status) as any)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
