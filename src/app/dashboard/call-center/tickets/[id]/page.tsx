import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketReplyForm } from "@/components/support/ticket-reply-form";
import { User, Tag, AlertTriangle, Calendar } from "lucide-react";

async function getTicket(id: string) {
  return await db.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, role: true } },
      assignedTo: { select: { name: true } },
      parent: { include: { user: { select: { name: true, phone: true } } } },
      replies: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.CALL_CENTER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={ticket.subject} subtitle={`Ticket #${ticket.id.slice(0, 8)} · ${ticket.category}`} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Ticket info sidebar */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Details</h3>
              {[
                { icon: User, label: "Created by", value: ticket.user.name ?? ticket.user.email },
                { icon: Tag, label: "Category", value: ticket.category },
                { icon: AlertTriangle, label: "Priority", value: ticket.priority },
                { icon: Calendar, label: "Created", value: new Date(ticket.createdAt).toLocaleString() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>Status</p>
                <Badge variant="outline">{ticket.status}</Badge>
              </div>
              {ticket.assignedTo && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>Assigned to</p>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{ticket.assignedTo.name}</p>
                </div>
              )}
              {ticket.parent && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>Parent Contact</p>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{ticket.parent.user.name}</p>
                  {ticket.parent.user.phone && (
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ticket.parent.user.phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Original message */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    {(ticket.user.name ?? "U")[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{ticket.user.name ?? "User"}</p>
                    <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{ticket.body}</p>
              </CardContent>
            </Card>

            {/* Replies */}
            {ticket.replies.map((reply) => {
              const isStaff = reply.user.role !== "PARENT";
              return (
                <Card key={reply.id} style={reply.isInternal ? { borderColor: "rgba(251,191,36,0.2)" } : {}}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: isStaff ? "rgba(255,255,255,0.1)" : "var(--primary)",
                          color: isStaff ? "var(--foreground)" : "var(--primary-foreground)",
                        }}>
                        {(reply.user.name ?? "U")[0]}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{reply.user.name ?? "User"}</p>
                        {isStaff && <Badge variant="outline" className="text-[10px]">Staff</Badge>}
                        {reply.isInternal && <Badge variant="outline" className="text-[10px] text-amber-400">Internal</Badge>}
                      </div>
                      <p className="text-[10px] ml-auto" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{reply.body}</p>
                  </CardContent>
                </Card>
              );
            })}

            {/* Reply form */}
            <TicketReplyForm ticketId={ticket.id} ticketStatus={ticket.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
