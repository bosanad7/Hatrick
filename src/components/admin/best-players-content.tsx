"use client";

import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, User } from "lucide-react";

interface Award {
  id: string;
  category: string;
  reason: string | null;
  achievement: string | null;
  player: {
    firstName: string;
    lastName: string;
    ageGroup: string;
    playerType: string;
    photo: string | null;
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
      {/* Info */}
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {t("best_players_subtitle")}
      </p>

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
        <div className="grid gap-4 sm:grid-cols-2">
          {awards.map((award) => (
            <Card key={award.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Player photo */}
                  <div className="flex-shrink-0">
                    {award.player.photo ? (
                      <img
                        src={award.player.photo}
                        alt={`${award.player.firstName} ${award.player.lastName}`}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <User className="h-6 w-6" style={{ color: "var(--muted-foreground)" }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {award.player.firstName} {award.player.lastName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {award.player.ageGroup} · {award.player.playerType}
                        </p>
                      </div>
                      <Trophy className="h-5 w-5 flex-shrink-0" style={{ color: "#fbbf24" }} />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">{award.category}</Badge>
                      <Star className="h-3 w-3" style={{ color: "#fbbf24" }} />
                    </div>

                    {award.achievement && (
                      <p className="mt-2 text-xs italic" style={{ color: "var(--foreground)" }}>
                        &ldquo;{award.achievement}&rdquo;
                      </p>
                    )}

                    {award.reason && (
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {award.reason}
                      </p>
                    )}
                  </div>
                </div>
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
