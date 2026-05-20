import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParentReplyForm } from "@/components/support/parent-reply-form";

async function getTicket(id: string, userId: string) {
  return await db.ticket.findUnique({
    where: { id, userId },
    include: {
      replies: {
        where: { isInternal: false },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export default async function ParentTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([Role.ADMIN, Role.PARENT] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { id } = await params;
  const ticket = userId ? await getTicket(id, userId) : null;
  if (!ticket) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={ticket.subject} subtitle={`${ticket.category} · ${ticket.status}`} />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Original message */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
              <Badge variant="outline">{ticket.status}</Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{ticket.body}</p>
          </CardContent>
        </Card>

        {/* Replies (excluding internal) */}
        {ticket.replies.map((reply) => {
          const isStaff = reply.user.role !== "PARENT";
          return (
            <Card key={reply.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: isStaff ? "rgba(255,255,255,0.1)" : "var(--primary)",
                      color: isStaff ? "var(--foreground)" : "var(--primary-foreground)",
                    }}>
                    {(reply.user.name ?? "U")[0]}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {isStaff ? "Support Team" : reply.user.name ?? "You"}
                  </p>
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
        {ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
          <ParentReplyForm ticketId={ticket.id} />
        )}
      </div>
    </div>
  );
}
