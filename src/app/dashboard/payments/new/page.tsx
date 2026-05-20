import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { NewPaymentForm } from "@/components/payments/new-payment-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function NewPaymentPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  let players: Awaited<ReturnType<typeof db.player.findMany>> = [];
  try {
    players = await db.player.findMany({
      include: { parent: { include: { user: true } } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  } catch { /* db not ready */ }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Record Payment" subtitle="Log a new payment for a player or parent" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <NewPaymentForm
            players={players.map((p) => ({
              id: p.id,
              name: `${p.firstName} ${p.lastName}`,
              parentId: p.parentId,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
