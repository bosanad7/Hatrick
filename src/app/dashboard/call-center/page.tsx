import { Header } from "@/components/layout/header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Headphones, TicketCheck, Clock, CheckCircle } from "lucide-react";
import { T } from "@/components/t";

async function getTicketStats() {
  try {
    const [open, inProgress, resolved, total] = await Promise.all([
      db.ticket.count({ where: { status: "OPEN" } }),
      db.ticket.count({ where: { status: "IN_PROGRESS" } }),
      db.ticket.count({ where: { status: "RESOLVED" } }),
      db.ticket.count(),
    ]);
    return { open, inProgress, resolved, total };
  } catch {
    return { open: 0, inProgress: 0, resolved: 0, total: 0 };
  }
}

export default async function CallCenterDashboard() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.CALL_CENTER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const stats = await getTicketStats();

  const cards = [
    { tKey: "open_tickets" as const, value: stats.open, icon: TicketCheck, accent: "rgba(255,255,255,0.12)" },
    { tKey: "in_progress" as const, value: stats.inProgress, icon: Clock, accent: "rgba(255,255,255,0.08)" },
    { tKey: "resolved" as const, value: stats.resolved, icon: CheckCircle, accent: "rgba(255,255,255,0.06)" },
    { tKey: "total_tickets" as const, value: stats.total, icon: Headphones, accent: "rgba(255,255,255,0.04)" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Call Center" subtitle="Support ticket management" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map(({ tKey, value, icon: Icon, accent }) => (
            <Card key={tKey}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}><T k={tKey} /></p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: accent }}>
                    <Icon className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Headphones className="mx-auto h-12 w-12 mb-4" style={{ color: "var(--muted-foreground)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}><T k="call_center" /></h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              <T k="call_center_desc" />
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
