import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const replies = await db.ticketReply.findMany({
    where: { ticketId: id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(replies);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id ?? "";
  const role = (session.user as { role?: Role }).role ?? Role.PARENT;

  const body = await req.json();
  const { body: replyBody, isInternal } = body;

  if (!replyBody) {
    return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
  }

  // Verify ticket exists and user has access
  const ticket = await db.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (role === Role.PARENT && ticket.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reply = await db.ticketReply.create({
    data: {
      ticketId: id,
      userId,
      body: replyBody,
      isInternal: role !== Role.PARENT && isInternal === true,
    },
    include: { user: { select: { name: true, role: true } } },
  });

  // Update ticket status if staff replies
  if (role === Role.CALL_CENTER || role === Role.ADMIN) {
    await db.ticket.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json(reply, { status: 201 });
}
