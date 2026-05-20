import { db } from "@/lib/db";
import { PitchName, Role } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PitchesClient } from "./pitches-client";

// ─── Pitch metadata ────────────────────────────────────────────────────────────

const PITCHES: { name: PitchName; label: string; typeKey: string; descriptionKey: string }[] = [
  { name: "PITCH_1", label: "Pitch 1", typeKey: "fifa_quality", descriptionKey: "full_size_pitch" },
  { name: "PITCH_2", label: "Pitch 2", typeKey: "fifa_quality", descriptionKey: "full_size_pitch" },
  { name: "PITCH_3", label: "Pitch 3", typeKey: "fifa_quality", descriptionKey: "full_size_pitch" },
  { name: "PITCH_4", label: "Pitch 4", typeKey: "fifa_quality", descriptionKey: "full_size_pitch" },
  { name: "PITCH_5A", label: "Pitch 5A", typeKey: "five_a_side", descriptionKey: "compact_pitch" },
  { name: "PITCH_5B", label: "Pitch 5B", typeKey: "five_a_side", descriptionKey: "compact_pitch" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PitchesPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { start, end } = todayRange();

  let todaySessions: Awaited<ReturnType<typeof db.trainingSession.findMany<{ include: { group: true; coach: { include: { user: true } } } }>>> = [];
  let upcomingBookings: Awaited<ReturnType<typeof db.pitchBooking.findMany>> = [];
  try {
    [todaySessions, upcomingBookings] = await Promise.all([
      db.trainingSession.findMany({
        where: { startTime: { gte: start, lte: end } },
        include: { group: true, coach: { include: { user: true } } },
        orderBy: { startTime: "asc" },
      }),
      db.pitchBooking.findMany({
        where: {
          startTime: { gte: new Date() },
          status: { not: "CANCELLED" },
        },
        orderBy: { startTime: "asc" },
        take: 20,
      }),
    ]);
  } catch { /* db not ready */ }

  // Group sessions and bookings by pitch
  const sessionsByPitch = PITCHES.reduce<
    Record<PitchName, typeof todaySessions>
  >((acc, p) => {
    acc[p.name] = todaySessions.filter((s) => s.pitch === p.name);
    return acc;
  }, {} as Record<PitchName, typeof todaySessions>);

  const bookingsByPitch = PITCHES.reduce<
    Record<PitchName, typeof upcomingBookings>
  >((acc, p) => {
    acc[p.name] = upcomingBookings.filter((b) => b.pitch === p.name);
    return acc;
  }, {} as Record<PitchName, typeof upcomingBookings>);

  const todayLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  // Serialize data for the client component
  const pitchData = PITCHES.map((pitch) => ({
    name: pitch.name,
    label: pitch.label,
    typeKey: pitch.typeKey,
    descriptionKey: pitch.descriptionKey,
    sessions: (sessionsByPitch[pitch.name] ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      startTime: formatTime(s.startTime),
      endTime: formatTime(s.endTime),
      groupName: s.group.name,
    })),
    bookings: (bookingsByPitch[pitch.name] ?? []).map((b) => ({
      id: b.id,
      type: b.type.toLowerCase(),
      bookedBy: b.bookedBy,
      status: b.status,
      dateLabel: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
      }).format(b.startTime),
      startTime: formatTime(b.startTime),
      endTime: formatTime(b.endTime),
      totalAmount: b.totalAmount != null ? formatCurrency(b.totalAmount) : null,
    })),
  }));

  return (
    <PitchesClient
      pitches={pitchData}
      todaySessionCount={todaySessions.length}
      todayLabel={todayLabel}
    />
  );
}
