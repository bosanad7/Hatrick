import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { Role, SubscriptionType, SubscriptionStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  const userId = (session.user as { id?: string }).id;

  // Parents can only see their own subscriptions
  if (role === Role.PARENT) {
    if (!can(role, PERMISSIONS.VIEW_OWN_SUBSCRIPTIONS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parent = await db.parent.findUnique({ where: { userId: userId ?? "" } });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const subs = await db.subscription.findMany({
      where: { parentId: parent.id },
      include: { player: true, coupon: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subs);
  }

  // Admin / Manager see all
  if (!can(role, PERMISSIONS.VIEW_ALL_SUBSCRIPTIONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as SubscriptionStatus | null;
  const type = url.searchParams.get("type") as SubscriptionType | null;
  const search = url.searchParams.get("search");

  const subs = await db.subscription.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            player: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            },
          }
        : {}),
    },
    include: {
      player: true,
      parent: { include: { user: { select: { name: true, email: true } } } },
      coupon: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_SUBSCRIPTIONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { playerId, parentId, type, startDate, endDate, totalSessions, amount, discount, couponId } = body;

  if (!playerId || !parentId || !type || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sub = await db.subscription.create({
    data: {
      playerId,
      parentId,
      type: type as SubscriptionType,
      status: "ACTIVE",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalSessions: totalSessions ?? null,
      amount: amount ?? 0,
      discount: discount ?? 0,
      couponId: couponId ?? null,
    },
    include: { player: true, parent: true },
  });

  // Increment coupon usage if used
  if (couponId) {
    await db.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  const userId = (session.user as { id?: string }).id ?? "";
  await logAudit({
    userId,
    action: "CREATE_SUBSCRIPTION",
    entity: "Subscription",
    entityId: sub.id,
    details: { playerId, type, amount },
  });

  return NextResponse.json(sub, { status: 201 });
}
