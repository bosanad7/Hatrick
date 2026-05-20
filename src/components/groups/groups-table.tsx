"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { Plus } from "lucide-react";
import Link from "next/link";

interface GroupsTableProps {
  groups: Array<{
    id: string;
    name: string;
    ageGroup: string;
    maxCapacity: number;
    description: string | null;
    _count: { groupPlayers: number };
  }>;
}

export function GroupsTable({ groups }: GroupsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">{t("groups_subtitle")}</p>
        <Button asChild>
          <Link href="/dashboard/groups/new">
            <Plus className="h-4 w-4" />
            {t("create_group")}
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
                  <th className="px-4 py-3">{t("group_name")}</th>
                  <th className="px-4 py-3">{t("age_group")}</th>
                  <th className="px-4 py-3">{t("players")}</th>
                  <th className="px-4 py-3">{t("capacity")}</th>
                  <th className="px-4 py-3">{t("availability")}</th>
                  <th className="px-4 py-3">{t("description")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                      {t("no_groups_found")}
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => {
                    const playerCount = group._count.groupPlayers;
                    const isFull = playerCount >= group.maxCapacity;
                    const spotsLeft = group.maxCapacity - playerCount;

                    return (
                      <tr key={group.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-xs font-bold text-[#cccccc]">
                              {group.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-medium text-[var(--foreground)]">{group.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge>{group.ageGroup.replace("U", `${t("under")} `)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{playerCount}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{group.maxCapacity}</td>
                        <td className="px-4 py-3">
                          {isFull ? (
                            <Badge variant="destructive">{t("full")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("spots_left", { n: spotsLeft })}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs truncate">
                          {group.description ?? "—"}
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
