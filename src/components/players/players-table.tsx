"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getAge } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { PlayerStatus, AgeGroup } from "@prisma/client";

const statusColors: Record<string, string> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  WAITLIST: "warning",
  SUSPENDED: "destructive",
} as const;

const statusKeys: Record<string, string> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  WAITLIST: "waitlist",
  SUSPENDED: "suspended",
};

interface PlayersTableProps {
  players: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number | null;
    ageGroup: AgeGroup;
    dateOfBirth: Date;
    position: string | null;
    status: PlayerStatus;
    enrollmentDate: Date;
    photo: string | null;
    freeTrialUsed: boolean;
    parent: { user: { name: string | null }; phone: string | null };
  }>;
  searchParams: { search?: string; ageGroup?: string; status?: string };
  ageGroups: string[];
  playerStatuses: string[];
}

export function PlayersTable({ players, searchParams, ageGroups, playerStatuses }: PlayersTableProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              name="search"
              defaultValue={searchParams.search}
              placeholder={t("search_players")}
              className="h-10 rounded-lg border border-input bg-[var(--card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
          <select
            name="ageGroup"
            defaultValue={searchParams.ageGroup}
            className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("all_age_groups")}</option>
            {ageGroups.map((g) => (
              <option key={g} value={g}>{g.replace("U", `${t("under")} `)}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status}
            className="h-10 rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t("all_statuses")}</option>
            {playerStatuses.map((s) => (
              <option key={s} value={s}>
                {t(statusKeys[s] as "active" | "inactive" | "waitlist" | "suspended")}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
        </form>

        <Button asChild>
          <Link href="/dashboard/players/new">
            <Plus className="h-4 w-4" />
            {t("add_player")}
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
                  <th className="px-4 py-3">{t("player_name")}</th>
                  <th className="px-4 py-3">{t("age_group")}</th>
                  <th className="px-4 py-3">{t("age")}</th>
                  <th className="px-4 py-3">{t("position")}</th>
                  <th className="px-4 py-3">{t("parent_name")}</th>
                  <th className="px-4 py-3">{t("parent_phone")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("enrollment_date")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                      {t("no_players_found")}
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr key={player.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {player.photo ? (
                            <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                              {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {player.firstName} {player.lastName}
                            </p>
                            {player.jerseyNumber && (
                              <p className="text-xs text-[var(--muted-foreground)]">#{player.jerseyNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{player.ageGroup}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {getAge(player.dateOfBirth)} {t("yrs")}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {player.position ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {player.parent.user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]" dir="ltr">
                        {player.parent.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                        <Badge variant={statusColors[player.status] as "default" | "secondary" | "destructive" | "warning" | "outline"}>
                          {t(statusKeys[player.status] as "active" | "inactive" | "waitlist" | "suspended")}
                        </Badge>
                        {player.freeTrialUsed && (
                          <span className="rounded px-1 py-0.5 text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: "var(--muted-foreground)" }}>
                            Trial
                          </span>
                        )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {formatDate(player.enrollmentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/players/${player.id}`}>{t("view_profile")}</Link>
                        </Button>
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
  );
}
