import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentStatus, PaymentType, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsClient } from "./payments-client";

async function getPayments(status?: string, type?: string) {
  try {
    return await db.payment.findMany({
      where: {
        ...(status ? { status: status as PaymentStatus } : {}),
        ...(type ? { type: type as PaymentType } : {}),
      },
      include: {
        player: true,
        parent: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (!role || !([Role.ADMIN, Role.MANAGER] as Role[]).includes(role)) {
    redirect("/dashboard/access-denied");
  }

  const params = await searchParams;
  const payments = await getPayments(params.status, params.type);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const paymentRows = payments.map((payment) => ({
    id: payment.id,
    playerName: payment.player
      ? `${payment.player.firstName} ${payment.player.lastName}`
      : null,
    playerInitials: payment.player
      ? `${payment.player.firstName.charAt(0)}${payment.player.lastName.charAt(0)}`
      : null,
    parentName: payment.parent.user.name ?? payment.parent.user.email ?? "—",
    type: payment.type,
    amount: formatCurrency(payment.amount, payment.currency),
    status: payment.status,
    dueDate: formatDate(payment.dueDate),
    paidDate: payment.paidAt ? formatDate(payment.paidAt) : null,
  }));

  return (
    <PaymentsClient
      payments={paymentRows}
      totalPaidFormatted={formatCurrency(totalPaid)}
      params={{ status: params.status, type: params.type }}
      statusValues={Object.values(PaymentStatus)}
      typeValues={Object.values(PaymentType)}
    />
  );
}
