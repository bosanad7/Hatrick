"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
}

export function BestPlayerForm({
  players,
  categories,
  month,
  year,
}: {
  players: Player[];
  categories: string[];
  month: number;
  year: number;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [reason, setReason] = useState("");
  const [achievement, setAchievement] = useState("");

  if (categories.length === 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !category) return;
    setLoading(true);

    try {
      const res = await fetch("/api/best-players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, month, year, category, reason, achievement }),
      });

      if (res.ok) {
        setPlayerId("");
        setReason("");
        setAchievement("");
        router.refresh();
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: "var(--foreground)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {t("add_award")}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {t("player")}
            </label>
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="">{t("select_player")}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.ageGroup})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {t("category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {t("reason_optional")}
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("outstanding_performance")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {t("achievement")}
            </label>
            <input
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder={t("achievement_placeholder")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              disabled={loading || !playerId}
              className="w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {loading ? t("adding") : t("add_award")}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
