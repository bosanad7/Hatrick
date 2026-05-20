import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { Role, TicketCategory, TicketPriority } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userId = (session.user as { id?: string }).id ?? "";

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");

  // Parents see own tickets only
  if (role === Role.PARENT) {
    const tickets = await db.ticket.findMany({
      where: {
        userId,
        ...(status ? { status: status as never } : {}),
        ...(category ? { category: category as TicketCategory } : {}),
      },
      include: { _count: { select: { replies: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tickets);
  }

  // Admin / Call Center see all
  if (!can(role, PERMISSIONS.VIEW_ALL_TICKETS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tickets = await db.ticket.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(category ? { category: category as TicketCategory } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id ?? "";
  const role = (session.user as { role?: Role }).role ?? Role.PARENT;

  const body = await req.json();
  const { category, priority, subject, body: ticketBody } = body;

  if (!category || !subject || !ticketBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get parent ID if applicable
  let parentId: string | null = null;
  if (role === Role.PARENT) {
    const parent = await db.parent.findUnique({ where: { userId } });
    parentId = parent?.id ?? null;
  }

  const ticket = await db.ticket.create({
    data: {
      userId,
      parentId,
      category: category as TicketCategory,
      priority: (priority as TicketPriority) ?? "MEDIUM",
      subject,
      body: ticketBody,
      status: "OPEN",
    },
  });

  await logAudit({
    userId,
    action: "CREATE_TICKET",
    entity: "Ticket",
    entityId: ticket.id,
    details: { category, subject },
  });

  return NextResponse.json(ticket, { status: 201 });
}
