"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star } from "lucide-react";

interface Award {
  id: string;
  category: string;
  reason: string | null;
  player: {
    firstName: string;
    lastName: string;
    ageGroup: string;
    playerType: string;
  };
}

interface BestPlayersContentProps {
  awards: Award[];
  month: number;
  year: number;
  monthNames: string[];
}

export function BestPlayersContent({ awards, month, year, monthNames }: BestPlayersContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Month selector */}
      <Card>
        <CardContent className="p-4">
          <form className="flex items-center gap-3">
            <select
              name="month"
              defaultValue={month}
              className="rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              name="year"
              defaultValue={year}
              className="rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {t("month_selector")}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Current awards */}
      {awards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <Card key={award.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <Trophy className="h-5 w-5" style={{ color: "#fbbf24" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {award.player.firstName} {award.player.lastName}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {award.player.ageGroup} · {award.player.playerType}
                      </p>
                    </div>
                  </div>
                  <Star className="h-4 w-4" style={{ color: "#fbbf24" }} />
                </div>
                <div className="mt-3">
                  <Badge variant="outline">{award.category}</Badge>
                </div>
                {award.reason && (
                  <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {award.reason}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {t("no_awards", { month: monthNames[month - 1], year })}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
