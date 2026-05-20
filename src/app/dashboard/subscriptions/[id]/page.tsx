import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { SubscriptionActions } from "@/components/registration/subscription-actions";
import {
  Calendar, CreditCard, User, Users, Snowflake,
  CheckCircle, XCircle, Clock, Tag,
} from "lucide-react";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const { id } = await params;

  const sub = await db.subscription.findUnique({
    where: { id },
    include: {
      player: true,
      parent: { include: { user: { select: { name: true, email: true, phone: true } } } },
      coupon: true,
      postponements: { orderBy: { requestedAt: "desc" } },
    },
  });

  if (!sub) notFound();

  const statusIcon = {
    ACTIVE: CheckCircle,
    FROZEN: Snowflake,
    EXPIRED: Clock,
    CANCELLED: XCircle,
  }[sub.status];
  const StatusIcon = statusIcon;

  const infoItems = [
    { icon: User, label: "Player", value: `${sub.player.firstName} ${sub.player.lastName} (${sub.player.ageGroup})` },
    { icon: Users, label: "Parent", value: sub.parent.user.name ?? sub.parent.user.email },
    { icon: CreditCard, label: "Amount", value: `${sub.amount} KWD${sub.discount > 0 ? ` (−${sub.discount} discount)` : ""}` },
    { icon: Calendar, label: "Period", value: `${new Date(sub.startDate).toLocaleDateString()} – ${new Date(sub.endDate).toLocaleDateString()}` },
    { icon: Tag, label: "Type", value: sub.type.replace(/_/g, " ") },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Subscription Detail"
        subtitle={`${sub.player.firstName} ${sub.player.lastName} — ${sub.type.replace(/_/g, " ")}`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Status Banner */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6" style={{ color: "var(--foreground)" }} />
              <div>
                <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{sub.status}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {sub.totalSessions
                    ? `${sub.usedSessions} of ${sub.totalSessions} sessions used · ${sub.usedPostponements} of ${sub.maxPostponements} postponements used`
                    : `${sub.usedPostponements} of ${sub.maxPostponements} postponements used`}
                </p>
              </div>
            </div>
            {sub.coupon && (
              <Badge variant="outline" className="text-xs">
                Coupon: {sub.coupon.code}
              </Badge>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Info */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                Details
              </h3>
              {infoItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions (Admin only) */}
          {role === Role.ADMIN && (
            <SubscriptionActions
              subscriptionId={sub.id}
              status={sub.status}
              playerId={sub.playerId}
            />
          )}
        </div>

        {/* Postponements */}
        {sub.postponements.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                Postponement History
              </h3>
              <div className="space-y-3">
                {sub.postponements.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{p.reason || "No reason given"}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Requested {new Date(p.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{p.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
