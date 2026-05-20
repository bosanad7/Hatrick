import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { Role, CouponType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_COUPONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: Role }).role ?? Role.PARENT;
  if (!can(role, PERMISSIONS.MANAGE_COUPONS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, type, value, maxUses, minPlayers, validFrom, validUntil } = body;

  if (!code || !type || value === undefined || !validFrom || !validUntil) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check for duplicate code
  const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const coupon = await db.coupon.create({
    data: {
      code: code.toUpperCase(),
      type: type as CouponType,
      value: parseFloat(value),
      maxUses: maxUses ? parseInt(maxUses) : null,
      minPlayers: minPlayers ? parseInt(minPlayers) : 1,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive: true,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
