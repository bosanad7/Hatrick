import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateTicketForm } from "@/components/support/create-ticket-form";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { T } from "@/components/t";

const statusConfig = {
  OPEN:        { label: "Open",        icon: AlertCircle, color: "#ffffff" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,       color: "#cccccc" },
  ESCALATED:   { label: "Escalated",   icon: AlertCircle, color: "#fbbf24" },
  RESOLVED:    { label: "Resolved",    icon: CheckCircle, color: "#888888" },
  CLOSED:      { label: "Closed",      icon: CheckCircle, color: "#666666" },
} as const;

async function getParentTickets(userId: string) {
  try {
    return await db.ticket.findMany({
      where: { userId },
      include: { _count: { select: { replies: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function ParentSupportPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const tickets = userId ? await getParentTickets(userId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Support" subtitle="Get help or submit feedback" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <CreateTicketForm />

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              <T k="tickets" /> ({tickets.length})
            </h3>

            {tickets.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}><T k="no_tickets" /></p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const sc = statusConfig[t.status as keyof typeof statusConfig] ?? statusConfig.OPEN;
                  const StatusIcon = sc.icon;
                  return (
                    <Link key={t.id} href={`/dashboard/parent/support/${t.id}`}>
                      <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
                        style={{ borderColor: "var(--border)" }}>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{t.subject}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {t.category} · {new Date(t.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <StatusIcon className="h-3.5 w-3.5" style={{ color: sc.color }} />
                          <Badge variant="outline" className="text-[10px]">{sc.label}</Badge>
                          {t._count.replies > 0 && (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {t._count.replies} replies
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
