"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { CoachRole } from "@prisma/client";

const roleColors: Record<string, string> = {
  HEAD_COACH: "default",
  ASSISTANT_COACH: "secondary",
  GOALKEEPER_COACH: "outline",
  FITNESS_COACH: "warning",
} as const;

const roleKeys: Record<string, TranslationKey> = {
  HEAD_COACH: "head_coach",
  ASSISTANT_COACH: "assistant_coach",
  GOALKEEPER_COACH: "goalkeeper_coach",
  FITNESS_COACH: "fitness_coach",
};

interface CoachesTableProps {
  coaches: Array<{
    id: string;
    coachRole: CoachRole;
    speciality: string | null;
    licenseNo: string | null;
    hireDate: Date;
    user: { name: string | null; email: string | null };
  }>;
}

export function CoachesTable({ coaches }: CoachesTableProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("manage_coaching_staff")}
        </p>
        <Button asChild>
          <Link href="/dashboard/coaches/new">
            <Plus className="h-4 w-4" />
            {t("add_coach")}
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
                  <th className="px-4 py-3">{t("name")}</th>
                  <th className="px-4 py-3">{t("email")}</th>
                  <th className="px-4 py-3">{t("coach_role")}</th>
                  <th className="px-4 py-3">{t("speciality")}</th>
                  <th className="px-4 py-3">{t("license_no")}</th>
                  <th className="px-4 py-3">{t("hire_date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {coaches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                      {t("no_coaches_found")}
                    </td>
                  </tr>
                ) : (
                  coaches.map((coach) => (
                    <tr key={coach.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                            {(coach.user.name ?? coach.user.email ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-[var(--foreground)]">
                            {coach.user.name ?? "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{coach.user.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            roleColors[coach.coachRole] as
                              | "default"
                              | "secondary"
                              | "outline"
                              | "warning"
                              | "destructive"
                          }
                        >
                          {t(roleKeys[coach.coachRole])}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{coach.speciality ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{coach.licenseNo ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(coach.hireDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
