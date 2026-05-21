import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { applyCoupon, PLAN_PRICES } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, playerCount, plan } = body;

  if (!code) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) {
    return NextResponse.json({ valid: false, error: "Coupon not found" });
  }

  const planPrice = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || PLAN_PRICES.TRAINING_ONLY;
  const result = applyCoupon(coupon, playerCount || 1, planPrice);
  return NextResponse.json({
    ...result,
    couponId: result.valid ? coupon.id : undefined,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
  });
}
