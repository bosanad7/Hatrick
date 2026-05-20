"use client";

import { useTranslation } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { PaymentStatus, PaymentType } from "@prisma/client";

const statusVariant: Record<string, "warning" | "default" | "destructive" | "secondary"> = {
  PENDING: "warning",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

const statusKey: Record<string, string> = {
  PAID: "paid",
  PENDING: "pending",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
};

const typeKey: Record<string, string> = {
  REGISTRATION: "type_registration",
  MONTHLY: "type_monthly",
  TERM: "type_term",
  ANNUAL: "type_annual",
  EVENT: "type_event",
  RENTAL: "type_rental",
  SUBSCRIPTION: "type_subscription",
  MERCHANDISE: "type_merchandise",
};

interface PaymentRow {
  id: string;
  playerName: string | null;
  playerInitials: string | null;
  parentName: string;
  type: PaymentType;
  amount: string;
  status: PaymentStatus;
  dueDate: string;
  paidDate: string | null;
}

interface PaymentsClientProps {
  payments: PaymentRow[];
  totalPaidFormatted: string;
  params: { status?: string; type?: string };
  statusValues: string[];
  typeValues: string[];
}

export function PaymentsClient({
  payments,
  totalPaidFormatted,
  params,
  statusValues,
  typeValues,
}: PaymentsClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Payments"
        subtitle={t("payments_collected", { n: payments.length, amount: totalPaidFormatted })}
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex items-center gap-2">
            <select
              name="status"
              defaultValue={params.status}
              className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("all_statuses")}</option>
              {statusValues.map((s) => (
                <option key={s} value={s}>
                  {t((statusKey[s] ?? s) as any)}
                </option>
              ))}
            </select>

            <select
              name="type"
              defaultValue={params.type}
              className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("all_types")}</option>
              {typeValues.map((tv) => (
                <option key={tv} value={tv}>
                  {t((typeKey[tv] ?? tv) as any)}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" size="sm">
              {t("filter")}
            </Button>

            {(params.status || params.type) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/payments">{t("clear")}</Link>
              </Button>
            )}
          </form>

          <Button asChild>
            <Link href="/dashboard/payments/new">
              <Plus className="h-4 w-4" />
              {t("record_payment")}
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-3">{t("player")}</th>
                    <th className="px-4 py-3">{t("parent")}</th>
                    <th className="px-4 py-3">{t("type")}</th>
                    <th className="px-4 py-3">{t("amount")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("due_date")}</th>
                    <th className="px-4 py-3">{t("paid_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                        {t("no_payments_found")}
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3">
                          {payment.playerName ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                                {payment.playerInitials}
                              </div>
                              <span className="font-medium text-[var(--foreground)]">
                                {payment.playerName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {payment.parentName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{t((typeKey[payment.type] ?? payment.type) as any)}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)] tabular-nums">
                          {payment.amount}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[payment.status]}>
                            {t((statusKey[payment.status] ?? payment.status) as any)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {payment.dueDate}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {payment.paidDate ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
