import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User } from "lucide-react";

async function getChildSchedule(userId: string) {
  try {
    const parent = await db.parent.findUnique({ where: { userId } });
    if (!parent) return [];
    return await db.trainingSession.findMany({
      where: {
        status: "SCHEDULED",
        startTime: { gte: new Date() },
        group: { groupPlayers: { some: { player: { parentId: parent.id } } } },
      },
      include: { group: true, coach: { include: { user: true } } },
      orderBy: { startTime: "asc" },
    });
  } catch { return []; }
}

export default async function ParentSchedulePage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const sessions = userId ? await getChildSchedule(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Training Schedule" subtitle={`${sessions.length} upcoming session${sessions.length !== 1 ? "s" : ""} for your children`} />
      <div className="flex-1 overflow-auto p-6">
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Session</th><th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Group</th><th className="px-4 py-3">Coach</th><th className="px-4 py-3">Pitch</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--muted-foreground)]">No upcoming sessions for your children.</td></tr>
                ) : sessions.map(s => (
                  <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{s.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                        <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"2-digit",month:"short"}).format(s.startTime)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}).format(s.startTime)}
                          {" – "}
                          {new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false}).format(s.endTime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{s.group.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <User className="h-3.5 w-3.5" />{s.coach?.user?.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <MapPin className="h-3.5 w-3.5" />{s.pitch.replace("_"," ")}
                      </div>
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
