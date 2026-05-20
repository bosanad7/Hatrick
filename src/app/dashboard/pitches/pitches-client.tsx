"use client";

import { useTranslation } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Clock, CalendarDays, Tag } from "lucide-react";
import Link from "next/link";
import type { PitchName, BookingStatus } from "@prisma/client";

const bookingStatusStyle: Record<string, string> = {
  PENDING: "bg-[rgba(245,158,11,0.15)] text-amber-400",
  CONFIRMED: "bg-[rgba(16,185,129,0.15)] text-emerald-400",
  CANCELLED: "bg-[rgba(239,68,68,0.15)] text-red-400",
};

interface SessionItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  groupName: string;
}

interface BookingItem {
  id: string;
  type: string;
  bookedBy: string;
  status: BookingStatus;
  dateLabel: string;
  startTime: string;
  endTime: string;
  totalAmount: string | null;
}

interface PitchData {
  name: PitchName;
  label: string;
  typeKey: string;
  descriptionKey: string;
  sessions: SessionItem[];
  bookings: BookingItem[];
}

interface PitchesClientProps {
  pitches: PitchData[];
  todaySessionCount: number;
  todayLabel: string;
}

export function PitchesClient({ pitches, todaySessionCount, todayLabel }: PitchesClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Pitches"
        subtitle={`${t("pitches_subtitle")} · ${todayLabel}`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("training_sessions_today", { n: todaySessionCount })}
          </p>
          <Button asChild>
            <Link href="/dashboard/pitches/new">
              <Plus className="h-4 w-4" />
              {t("book_pitch")}
            </Link>
          </Button>
        </div>

        {/* Pitch cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pitches.map((pitch) => {
            const isBusy = pitch.sessions.length > 0;

            return (
              <Card
                key={pitch.name}
                className="rounded-xl border border-[var(--border)] shadow-sm overflow-hidden"
              >
                {/* Card header stripe */}
                <div
                  className={`h-1.5 w-full ${isBusy ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-[var(--foreground)]">
                        {pitch.label}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {t(pitch.descriptionKey as any)}
                      </CardDescription>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        pitch.typeKey === "fifa_quality"
                          ? "bg-[rgba(255,255,255,0.1)] text-[#cccccc]"
                          : "bg-[rgba(139,92,246,0.15)] text-violet-400"
                      }`}
                    >
                      {t(pitch.typeKey as any)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Today's sessions */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
                      {t("todays_sessions")}
                    </p>
                    {pitch.sessions.length === 0 ? (
                      <p className="text-sm text-[var(--muted-foreground)] italic">{t("no_sessions_today")}</p>
                    ) : (
                      <ul className="space-y-2">
                        {pitch.sessions.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-lg bg-[rgba(26,58,143,0.08)] border border-[rgba(26,58,143,0.2)] px-3 py-2"
                          >
                            <p className="text-sm font-medium text-[var(--foreground)]">{s.title}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {s.startTime} – {s.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {s.groupName}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Upcoming bookings */}
                  {pitch.bookings.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
                        {t("upcoming_bookings")}
                      </p>
                      <ul className="space-y-2">
                        {pitch.bookings.slice(0, 3).map((b) => (
                          <li
                            key={b.id}
                            className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border)] px-3 py-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--foreground)] capitalize">
                                {b.type} — {b.bookedBy}
                              </p>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bookingStatusStyle[b.status]}`}
                              >
                                {b.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {b.dateLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {b.startTime} – {b.endTime}
                              </span>
                              {b.totalAmount != null && (
                                <span className="font-medium text-[var(--muted-foreground)]">
                                  {b.totalAmount}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                        {pitch.bookings.length > 3 && (
                          <p className="text-xs text-[var(--muted-foreground)] text-center">
                            +{pitch.bookings.length - 3} more
                          </p>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
