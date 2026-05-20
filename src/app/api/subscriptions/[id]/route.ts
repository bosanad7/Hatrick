import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { Role, SubscriptionStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.VIEW_ALL_SUBSCRIPTIONS) && !can(role, PERMISSIONS.VIEW_OWN_SUBSCRIPTIONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const sub = await db.subscription.findUnique({
    where: { id },
    include: {
      player: true,
      parent: { include: { user: { select: { name: true, email: true, phone: true } } } },
      coupon: true,
      postponements: true,
      invoices: true,
    },
  });

  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(sub);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_SUBSCRIPTIONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const sub = await db.subscription.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as { id?: string }).id ?? "";

  switch (action) {
    case "freeze": {
      if (sub.status !== "ACTIVE") {
        return NextResponse.json({ error: "Can only freeze active subscriptions" }, { status: 400 });
      }
      const updated = await db.subscription.update({
        where: { id },
        data: { status: SubscriptionStatus.FROZEN },
      });
      await logAudit({ userId, action: "FREEZE_SUBSCRIPTION", entity: "Subscription", entityId: id });
      return NextResponse.json(updated);
    }

    case "unfreeze": {
      if (sub.status !== "FROZEN") {
        return NextResponse.json({ error: "Subscription is not frozen" }, { status: 400 });
      }
      const updated = await db.subscription.update({
        where: { id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
      await logAudit({ userId, action: "UNFREEZE_SUBSCRIPTION", entity: "Subscription", entityId: id });
      return NextResponse.json(updated);
    }

    case "cancel": {
      if (sub.status === "CANCELLED") {
        return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
      }
      const updated = await db.subscription.update({
        where: { id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
      await logAudit({ userId, action: "CANCEL_SUBSCRIPTION", entity: "Subscription", entityId: id });
      return NextResponse.json(updated);
    }

    case "extend": {
      const { newEndDate, additionalSessions } = body;
      const updated = await db.subscription.update({
        where: { id },
        data: {
          endDate: newEndDate ? new Date(newEndDate) : undefined,
          totalSessions: additionalSessions
            ? { increment: additionalSessions }
            : undefined,
        },
      });
      return NextResponse.json(updated);
    }

    case "transfer": {
      const { newPlayerId } = body;
      if (!newPlayerId) {
        return NextResponse.json({ error: "newPlayerId required" }, { status: 400 });
      }
      const updated = await db.subscription.update({
        where: { id },
        data: { playerId: newPlayerId },
      });
      return NextResponse.json(updated);
    }

    default: {
      // Generic field update
      const { status, amount, discount, endDate, totalSessions } = body;
      const updated = await db.subscription.update({
        where: { id },
        data: {
          ...(status ? { status: status as SubscriptionStatus } : {}),
          ...(amount !== undefined ? { amount } : {}),
          ...(discount !== undefined ? { discount } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          ...(totalSessions !== undefined ? { totalSessions } : {}),
        },
      });
      return NextResponse.json(updated);
    }
  }
}
