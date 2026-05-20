import { db } from "@/lib/db";
import { SessionStatus, PitchName, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScheduleClient } from "./schedule-client";

function formatSessionTime(start: Date, end: Date) {
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(start);

  const startTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(start);

  const endTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(end);

  return { dateStr, timeRange: `${startTime} – ${endTime}` };
}

const pitchLabel = (p: PitchName) =>
  p.replace("_", " ").replace("PITCH", "Pitch");

async function getSessions(status?: string, date?: string) {
  let dateFilter = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    dateFilter = { startTime: { gte: start, lte: end } };
  }

  try {
    return await db.trainingSession.findMany({
      where: {
        ...(status ? { status: status as SessionStatus } : {}),
        ...dateFilter,
      },
      include: {
        group: true,
        coach: { include: { user: true } },
      },
      orderBy: { startTime: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const sessions = await getSessions(params.status, params.date);

  const sessionRows = sessions.map((s) => {
    const { dateStr, timeRange } = formatSessionTime(s.startTime, s.endTime);
    return {
      id: s.id,
      title: s.title,
      notes: s.notes,
      status: s.status,
      dateStr,
      timeRange,
      groupName: s.group.name,
      ageGroup: s.group.ageGroup.replace("U", "U-"),
      coachName: s.coach.user.name ?? "—",
      coachRole: s.coach.coachRole
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      pitchLabel: pitchLabel(s.pitch),
    };
  });

  return (
    <ScheduleClient
      sessions={sessionRows}
      params={{ status: params.status, date: params.date }}
      statusValues={Object.values(SessionStatus)}
    />
  );
}
