import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userId = (session.user as { id?: string }).id;

  if (role === Role.PARENT) {
    const parent = await db.parent.findUnique({ where: { userId: userId ?? "" } });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const postponements = await db.sessionPostponement.findMany({
      where: { player: { parentId: parent.id } },
      include: {
        player: true,
        session: { include: { group: true } },
      },
      orderBy: { requestedAt: "desc" },
    });
    return NextResponse.json(postponements);
  }

  // Admin/Manager see all
  const postponements = await db.sessionPostponement.findMany({
    include: {
      player: true,
      session: { include: { group: true } },
      subscription: true,
    },
    orderBy: { requestedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(postponements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userId = (session.user as { id?: string }).id;

  if (role !== Role.PARENT && role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { playerId, sessionId, reason } = body;

  if (!playerId || !sessionId) {
    return NextResponse.json({ error: "playerId and sessionId required" }, { status: 400 });
  }

  // Verify ownership for parents
  if (role === Role.PARENT) {
    const parent = await db.parent.findUnique({ where: { userId: userId ?? "" } });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player || player.parentId !== parent.id) {
      return NextResponse.json({ error: "Not your child" }, { status: 403 });
    }
  }

  // Check postponement limit from active subscription
  const activeSub = await db.subscription.findFirst({
    where: { playerId, status: "ACTIVE" },
    orderBy: { endDate: "desc" },
  });

  if (activeSub) {
    if (activeSub.usedPostponements >= activeSub.maxPostponements) {
      return NextResponse.json({
        error: `Maximum postponements reached (${activeSub.maxPostponements}). No more postponements allowed.`,
      }, { status: 400 });
    }
  }

  // Check for duplicate
  const existing = await db.sessionPostponement.findFirst({
    where: { playerId, sessionId },
  });
  if (existing) {
    return NextResponse.json({ error: "Postponement already requested for this session" }, { status: 409 });
  }

  const postponement = await db.sessionPostponement.create({
    data: {
      playerId,
      sessionId,
      subscriptionId: activeSub?.id ?? null,
      reason: reason || null,
      status: "PENDING",
    },
  });

  // Auto-approve (for now) and increment counter
  await db.sessionPostponement.update({
    where: { id: postponement.id },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });

  if (activeSub) {
    await db.subscription.update({
      where: { id: activeSub.id },
      data: { usedPostponements: { increment: 1 } },
    });
  }

  return NextResponse.json(postponement, { status: 201 });
}
