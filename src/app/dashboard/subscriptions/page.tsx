import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, SubscriptionStatus, SubscriptionType } from "@prisma/client";
import { SubscriptionsContent } from "@/components/subscriptions/subscriptions-content";

async function getSubscriptions(search?: string, status?: string, type?: string) {
  try {
    return await db.subscription.findMany({
      where: {
        ...(status ? { status: status as SubscriptionStatus } : {}),
        ...(type ? { type: type as SubscriptionType } : {}),
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
  } catch {
    return [];
  }
}

async function getSubStats() {
  try {
    const [active, expired, frozen, cancelled] = await Promise.all([
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.subscription.count({ where: { status: "EXPIRED" } }),
      db.subscription.count({ where: { status: "FROZEN" } }),
      db.subscription.count({ where: { status: "CANCELLED" } }),
    ]);
    return { active, expired, frozen, cancelled, total: active + expired + frozen + cancelled };
  } catch {
    return { active: 0, expired: 0, frozen: 0, cancelled: 0, total: 0 };
  }
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const [subs, stats] = await Promise.all([
    getSubscriptions(params.search, params.status, params.type),
    getSubStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Subscriptions" subtitle="Manage player subscriptions & memberships" />

      <SubscriptionsContent
        subs={subs.map((sub) => ({
          id: sub.id,
          status: sub.status,
          type: sub.type,
          totalSessions: sub.totalSessions,
          usedSessions: sub.usedSessions,
          amount: sub.amount,
          discount: sub.discount,
          startDate: sub.startDate.toISOString(),
          endDate: sub.endDate.toISOString(),
          player: {
            firstName: sub.player.firstName,
            lastName: sub.player.lastName,
            ageGroup: sub.player.ageGroup,
          },
          parent: { user: { name: sub.parent.user.name, email: sub.parent.user.email } },
        }))}
        stats={{ active: stats.active, frozen: stats.frozen, expired: stats.expired, total: stats.total }}
        searchDefault={params.search}
        statusDefault={params.status}
        typeDefault={params.type}
        statusValues={Object.values(SubscriptionStatus)}
        typeValues={Object.values(SubscriptionType)}
      />
    </div>
  );
}
