import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { T } from "@/components/t";

async function getCoachSessions(userId: string) {
  try {
    const coach = await db.coach.findUnique({ where: { userId } });
    if (!coach) return [];
    return await db.trainingSession.findMany({
      where: { coachId: coach.id },
      include: { group: true },
      orderBy: { startTime: "asc" },
    });
  } catch { return []; }
}

const statusStyle: Record<string, string> = {
  SCHEDULED:  "bg-[rgba(255,255,255,0.1)] text-[#cccccc]",
  COMPLETED:  "bg-[rgba(16,185,129,0.15)] text-emerald-400",
  CANCELLED:  "bg-[rgba(239,68,68,0.15)] text-red-400",
};

export default async function CoachSessionsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.COACH] as Role[]).includes(role)) redirect("/dashboard/access-denied");

  const sessions = userId ? await getCoachSessions(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="My Sessions" subtitle={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} assigned`} />
      <div className="flex-1 overflow-auto p-6">
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3"><T k="session" /></th><th className="px-4 py-3"><T k="date_time" /></th>
                <th className="px-4 py-3"><T k="group" /></th><th className="px-4 py-3"><T k="pitch" /></th><th className="px-4 py-3"><T k="status" /></th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)]"><T k="no_sessions_found" /></td></tr>
                ) : sessions.map(s => (
                  <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                        <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short" }).format(s.startTime)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(s.startTime)}
                          {" – "}
                          {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(s.endTime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge>{s.group.name}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <MapPin className="h-3.5 w-3.5" />{s.pitch.replace("_"," ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
