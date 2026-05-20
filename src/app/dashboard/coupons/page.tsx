import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CouponsContent } from "@/components/coupons/coupons-content";

async function getCoupons() {
  try {
    return await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { subscriptions: true } } },
    });
  } catch {
    return [];
  }
}

export default async function CouponsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    redirect("/dashboard/access-denied");
  }

  const coupons = await getCoupons();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Coupons" subtitle="Manage discount codes" />

      <CouponsContent
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          isActive: c.isActive,
          usedCount: c.usedCount,
          maxUses: c.maxUses,
          minPlayers: c.minPlayers,
          validFrom: c.validFrom.toISOString(),
          validUntil: c.validUntil.toISOString(),
          _count: c._count,
        }))}
      />
    </div>
  );
}
