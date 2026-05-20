import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, TicketStatus, TicketCategory, TicketPriority } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, AlertCircle, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { T } from "@/components/t";

const statusStyle: Record<TicketStatus, { label: string; class: string }> = {
  OPEN:        { label: "Open",        class: "bg-[rgba(255,255,255,0.1)] text-[#ffffff]" },
  IN_PROGRESS: { label: "In Progress", class: "bg-[rgba(255,255,255,0.08)] text-[#cccccc]" },
  ESCALATED:   { label: "Escalated",   class: "bg-[rgba(251,191,36,0.15)] text-[#fbbf24]" },
  RESOLVED:    { label: "Resolved",    class: "bg-[rgba(255,255,255,0.05)] text-[#888888]" },
  CLOSED:      { label: "Closed",      class: "bg-[rgba(255,255,255,0.03)] text-[#666666]" },
};

const priorityStyle: Record<TicketPriority, { label: string; color: string }> = {
  LOW:    { label: "Low",    color: "#666666" },
  MEDIUM: { label: "Medium", color: "#aaaaaa" },
  HIGH:   { label: "High",   color: "#cccccc" },
  URGENT: { label: "Urgent", color: "#ffffff" },
};

async function getTickets(status?: string, category?: string, search?: string) {
  try {
    return await db.ticket.findMany({
      where: {
        ...(status ? { status: status as TicketStatus } : {}),
        ...(category ? { category: category as TicketCategory } : {}),
        ...(search ? {
          OR: [
            { subject: { contains: search } },
            { user: { name: { contains: search } } },
          ],
        } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function CallCenterTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.CALL_CENTER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const tickets = await getTickets(params.status, params.category, params.search);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Support Tickets" subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Filters */}
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input name="search" defaultValue={params.search} placeholder="Search..."
              className="h-10 rounded-lg border border-input bg-[var(--card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56" />
          </div>
          <select name="status" defaultValue={params.status}
            className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All</option>
            {Object.values(TicketStatus).map((s) => (
              <option key={s} value={s}>{statusStyle[s].label}</option>
            ))}
          </select>
          <select name="category" defaultValue={params.category}
            className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All</option>
            {Object.values(TicketCategory).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm"><T k="filter" /></Button>
        </form>

        {/* Ticket list */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {tickets.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}><T k="no_tickets" /></p>
                </div>
              ) : (
                tickets.map((t) => {
                  const ss = statusStyle[t.status];
                  const ps = priorityStyle[t.priority];
                  return (
                    <Link key={t.id} href={`/dashboard/call-center/tickets/${t.id}`}>
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: "rgba(255,255,255,0.06)" }}>
                            {t.status === "OPEN" && <AlertCircle className="h-4 w-4" style={{ color: "#ffffff" }} />}
                            {t.status === "IN_PROGRESS" && <Clock className="h-4 w-4" style={{ color: "#cccccc" }} />}
                            {t.status === "ESCALATED" && <AlertCircle className="h-4 w-4" style={{ color: "#fbbf24" }} />}
                            {(t.status === "RESOLVED" || t.status === "CLOSED") && <CheckCircle className="h-4 w-4" style={{ color: "#888888" }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{t.subject}</p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {t.user.name ?? t.user.email} · {t.category} · {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-[10px] font-medium" style={{ color: ps.color }}>{ps.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ss.class}`}>{ss.label}</span>
                          {t._count.replies > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <MessageSquare className="h-2.5 w-2.5" />{t._count.replies}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
