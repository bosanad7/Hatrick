"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Tag, Percent, DollarSign } from "lucide-react";

interface CouponData {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  isActive: boolean;
  usedCount: number;
  maxUses: number | null;
  minPlayers: number;
  validFrom: string;
  validUntil: string;
  _count: { subscriptions: number };
}

export function CouponsContent({ coupons }: { coupons: CouponData[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {t("coupons_count", { n: coupons.length })}
        </p>
        <Link href="/dashboard/coupons/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new_coupon")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.validUntil) < new Date();
          const isMaxed = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
          const isDisabled = !coupon.isActive || isExpired || isMaxed;

          return (
            <Card key={coupon.id} className={isDisabled ? "opacity-50" : ""}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" style={{ color: "var(--foreground)" }} />
                    <code className="text-base font-bold tracking-wide" style={{ color: "var(--foreground)" }}>
                      {coupon.code}
                    </code>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {coupon.isActive
                      ? (isExpired ? t("coupon_expired") : isMaxed ? t("coupon_maxed") : t("coupon_active"))
                      : t("coupon_inactive")}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {coupon.type === "PERCENTAGE" ? (
                    <Percent className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <DollarSign className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {coupon.type === "PERCENTAGE"
                      ? t("percent_off", { n: coupon.value })
                      : t("amount_off", { n: `${coupon.value} KWD` })}
                  </span>
                </div>

                <div className="space-y-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <p>
                    {t("used_count", { n: coupon.maxUses ? `${coupon.usedCount} / ${coupon.maxUses}` : coupon.usedCount })} · {t("linked_subs", { n: coupon._count.subscriptions })}
                  </p>
                  <p>{t("min_players", { n: coupon.minPlayers })}</p>
                  <p>
                    {t("valid_range", {
                      from: new Date(coupon.validFrom).toLocaleDateString(),
                      to: new Date(coupon.validUntil).toLocaleDateString(),
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {coupons.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <Tag className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {t("no_coupons")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
