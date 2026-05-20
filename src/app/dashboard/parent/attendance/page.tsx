import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

async function getChildAttendance(userId: string) {
  try {
    const parent = await db.parent.findUnique({ where: { userId } });
    if (!parent) return [];
    return await db.attendance.findMany({
      where: { player: { parentId: parent.id } },
      include: { player: true, session: { include: { group: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch { return []; }
}

const statusStyle: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: "rgba(16,185,129,0.15)",  text: "#34d399" },
  ABSENT:  { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  LATE:    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  EXCUSED: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
};

export default async function ParentAttendancePage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const records = userId ? await getChildAttendance(userId) : [];
  const presentCount = records.filter(r => r.status === "PRESENT").length;
  const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Attendance History" subtitle={`${records.length} records · ${rate}% attendance rate`} />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {records.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {(["PRESENT","ABSENT","LATE","EXCUSED"] as const).map(status => {
              const count = records.filter(r => r.status === status).length;
              const s = statusStyle[status];
              return (
                <div key={status} className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{status}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: s.text }}>{count}</p>
                </div>
              );
            })}
          </div>
        )}
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Child</th><th className="px-4 py-3">Session</th>
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
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.session.group.name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(r.session.startTime)}
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
