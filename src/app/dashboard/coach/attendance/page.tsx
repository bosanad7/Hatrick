import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getCoachAttendance(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId } });
    if (!coach) return [];
    return await db.attendance.findMany({
      where: { session: { coachId: coach.id } },
      include: { player: true, session: { include: { group: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch { return []; }
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: "rgba(16,185,129,0.15)",  text: "#34d399" },
  ABSENT:  { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  LATE:    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  EXCUSED: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
};

export default async function CoachAttendancePage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.COACH] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const records = userId ? await getCoachAttendance(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Attendance" subtitle={`${records.length} records from your sessions`} />
      <div className="flex-1 overflow-auto p-6">
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Player</th><th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Group</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)]">No attendance records yet.</td></tr>
                ) : records.map(r => {
                  const s = statusStyle[r.status] ?? statusStyle.ABSENT;
                  return (
                    <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.player.firstName} {r.player.lastName}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.session.title}</td>
                      <td className="px-4 py-3"><Badge>{r.session.group.name}</Badge></td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {new Intl.DateTimeFormat("en-GB", { day:"2-digit", month:"short", year:"numeric" }).format(r.session.startTime)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: s.bg, color: s.text }}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
