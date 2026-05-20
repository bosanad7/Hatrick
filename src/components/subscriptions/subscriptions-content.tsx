"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, CreditCard, Snowflake, XCircle, CheckCircle, Clock } from "lucide-react";

type StatusKey = "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";
type TypeKey = "NEW_MEMBERSHIP" | "RENEWAL" | "SINGLE_SESSION" | "TRIAL_SESSION";

const statusConfig: Record<StatusKey, { labelKey: TranslationKey; style: string; icon: typeof CheckCircle }> = {
  ACTIVE:    { labelKey: "active",     style: "bg-[rgba(255,255,255,0.1)] text-[#ffffff]",  icon: CheckCircle },
  EXPIRED:   { labelKey: "expired",    style: "bg-[rgba(255,255,255,0.06)] text-[#888888]", icon: Clock },
  FROZEN:    { labelKey: "frozen",     style: "bg-[rgba(255,255,255,0.08)] text-[#aaaaaa]", icon: Snowflake },
  CANCELLED: { labelKey: "cancelled",  style: "bg-[rgba(255,255,255,0.04)] text-[#666666]", icon: XCircle },
};

const typeLabelsMap: Record<TypeKey, TranslationKey> = {
  NEW_MEMBERSHIP: "new_membership",
  RENEWAL: "renewal",
  SINGLE_SESSION: "single_session",
  TRIAL_SESSION: "trial_session",
};

interface SubData {
  id: string;
  status: StatusKey;
  type: TypeKey;
  totalSessions: number | null;
  usedSessions: number;
  amount: number;
  discount: number;
  startDate: string;
  endDate: string;
  player: { firstName: string; lastName: string; ageGroup: string };
  parent: { user: { name: string | null; email: string | null } };
}

interface SubscriptionsContentProps {
  subs: SubData[];
  stats: { active: number; frozen: number; expired: number; total: number };
  searchDefault?: string;
  statusDefault?: string;
  typeDefault?: string;
  statusValues: string[];
  typeValues: string[];
}

export function SubscriptionsContent({
  subs,
  stats,
  searchDefault,
  statusDefault,
  typeDefault,
  statusValues,
  typeValues,
}: SubscriptionsContentProps) {
  const { t } = useTranslation();

  const statCards = [
    { labelKey: "active" as TranslationKey, value: stats.active, icon: CheckCircle },
    { labelKey: "frozen" as TranslationKey, value: stats.frozen, icon: Snowflake },
    { labelKey: "expired" as TranslationKey, value: stats.expired, icon: Clock },
    { labelKey: "total" as TranslationKey, value: stats.total, icon: CreditCard },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ labelKey, value, icon: Icon }) => (
          <Card key={labelKey}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{t(labelKey)}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon className="h-5 w-5" style={{ color: "var(--foreground)" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            name="search"
            defaultValue={searchDefault}
            placeholder={t("search_by_player")}
            className="h-10 rounded-lg border border-input bg-[var(--card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
          />
        </div>
        <select
          name="status"
          defaultValue={statusDefault}
          className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("all_status")}</option>
          {statusValues.map((s) => (
            <option key={s} value={s}>{t(statusConfig[s as StatusKey].labelKey)}</option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={typeDefault}
          className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("all_types")}</option>
          {typeValues.map((tv) => (
            <option key={tv} value={tv}>{t(typeLabelsMap[tv as TypeKey])}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">{t("filter")}</Button>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("player")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("parent")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("type")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("status")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("sessions_label")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("amount")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}>{t("period")}</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted-foreground)" }}></th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center" style={{ color: "var(--muted-foreground)" }}>
                      {t("no_subscriptions")}
                    </td>
                  </tr>
                ) : (
                  subs.map((sub) => {
                    const sc = statusConfig[sub.status];
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={sub.id} className="border-b transition-colors hover:bg-[rgba(255,255,255,0.02)]" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                              {sub.player.firstName[0]}{sub.player.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: "var(--foreground)" }}>{sub.player.firstName} {sub.player.lastName}</p>
                              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sub.player.ageGroup}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                          {sub.parent.user.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{t(typeLabelsMap[sub.type])}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.style}`}>
                            <StatusIcon className="h-3 w-3" />
                            {t(sc.labelKey)}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                          {sub.totalSessions ? `${sub.usedSessions}/${sub.totalSessions}` : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>
                          {sub.amount} KWD
                          {sub.discount > 0 && (
                            <span className="ml-1 text-xs" style={{ color: "var(--muted-foreground)" }}>(-{sub.discount})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(sub.startDate).toLocaleDateString()} – {new Date(sub.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/subscriptions/${sub.id}`}>
                            <Button variant="ghost" size="sm">{t("view")}</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
