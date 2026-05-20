import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getMyPayments(userId: string) {
  try {
    const parent = await db.parent.findUnique({ where: { userId } });
    if (!parent) return [];
    return await db.payment.findMany({
      where: { parentId: parent.id },
      include: { player: true },
      orderBy: { createdAt: "desc" },
    });
  } catch { return []; }
}

const typeLabel: Record<string, string> = {
  REGISTRATION:"Registration", MONTHLY:"Monthly", TERM:"Term",
  ANNUAL:"Annual", EVENT:"Event", RENTAL:"Rental",
};

export default async function ParentPaymentsPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!role || !([ Role.ADMIN, Role.PARENT] as Role[]).includes(role)) redirect("/dashboard/access-denied");
  const payments = userId ? await getMyPayments(userId) : [];
  const totalPaid = payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="My Payments" subtitle="Your payment history and pending invoices" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Paid",    amount: totalPaid,    color: "#ffffff" },
            { label: "Pending",       amount: totalPending, color: "#fbbf24" },
            { label: "Overdue",       amount: totalOverdue, color: "#f87171" },
          ].map(c => (
            <div key={c.label} className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{c.label}</p>
              <p className="mt-1 text-xl font-bold" style={{ color: c.color }}>{formatCurrency(c.amount)}</p>
            </div>
          ))}
        </div>
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Child</th><th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Paid Date</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--muted-foreground)]">No payments found.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                      {p.player ? `${p.player.firstName} ${p.player.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline">{typeLabel[p.type] ?? p.type}</Badge></td>
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{formatCurrency(p.amount, p.currency)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "PAID" ? "default" : p.status === "OVERDUE" ? "destructive" : "warning"}>
                        {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
