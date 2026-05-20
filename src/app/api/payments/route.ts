import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { PaymentType, PaymentStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_PAYMENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { playerId, type, amount, dueDate, notes } = body;

  if (!type || !amount || !dueDate) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Derive parentId from player if playerId provided, otherwise require explicit parentId
  let parentId: string = body.parentId;
  if (!parentId && playerId) {
    const player = await db.player.findUnique({ where: { id: playerId }, select: { parentId: true } });
    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    parentId = player.parentId;
  }
  if (!parentId) {
    return NextResponse.json({ error: "parentId is required." }, { status: 400 });
  }

  const payment = await db.payment.create({
    data: {
      parentId,
      playerId: playerId || null,
      type: type as PaymentType,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      notes: notes || null,
    },
    include: {
      player: true,
      parent: { include: { user: true } },
    },
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_PAYMENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    include: {
      player: true,
      parent: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}
