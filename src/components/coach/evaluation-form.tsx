"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, Snowflake, Clock, Shield,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────────── */

type StatusTag = "active" | "postponed" | "last-session" | "expired" | "trial";

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  playerType: string;
  jerseyNumber: number | null;
  statusTag: StatusTag;
  existingEval: {
    attendance: string;
    discipline: number;
    technical: number;
    tactical: number;
    fitness: number;
    teamwork: number;
    notes: string | null;
    recommendation: string | null;
  } | null;
}

interface PlayerEvalState {
  attendance: string;
  discipline: number;
  technical: number;
  tactical: number;
  fitness: number;
  teamwork: number;
  notes: string;
  recommendation: string;
}

interface EvaluationFormProps {
  sessionId: string;
  sessionTitle: string;
  groupName: string;
  players: PlayerData[];
  hasExistingEvals: boolean;
}

const STATUS_CONFIG: Record<StatusTag, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  active:         { label: "Active",       color: "#ffffff", bg: "rgba(255,255,255,0.08)", icon: Shield },
  trial:          { label: "Trial",        color: "#aaaaaa", bg: "rgba(255,255,255,0.05)", icon: Clock },
  "last-session": { label: "Last Session", color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   icon: AlertTriangle },
  expired:        { label: "Expired",      color: "#666666", bg: "rgba(255,255,255,0.03)", icon: Clock },
  postponed:      { label: "Postponed",    color: "#888888", bg: "rgba(255,255,255,0.03)", icon: Snowflake },
};

const SCORE_LABELS = ["discipline", "technical", "tactical", "fitness", "teamwork"] as const;
type ScoreKey = typeof SCORE_LABELS[number];

function defaultEval(player: PlayerData): PlayerEvalState {
  if (player.existingEval) {
    return {
      attendance: player.existingEval.attendance,
      discipline: player.existingEval.discipline,
      technical: player.existingEval.technical,
      tactical: player.existingEval.tactical,
      fitness: player.existingEval.fitness,
      teamwork: player.existingEval.teamwork,
      notes: player.existingEval.notes || "",
      recommendation: player.existingEval.recommendation || "",
    };
  }
  return {
    attendance: player.statusTag === "postponed" ? "EXCUSED" : "PRESENT",
    discipline: 5,
    technical: 5,
    tactical: 5,
    fitness: 5,
    teamwork: 5,
    notes: "",
    recommendation: "",
  };
}

/* ── Component ───────────────────────────────────────────────────────────────── */

export function EvaluationForm({
  sessionId, players, hasExistingEvals,
}: EvaluationFormProps) {
  const [evals, setEvals] = useState<Record<string, PlayerEvalState>>(() => {
    const initial: Record<string, PlayerEvalState> = {};
    for (const p of players) {
      initial[p.id] = defaultEval(p);
    }
    return initial;
  });
  const [expanded, setExpanded] = useState<string | null>(
    players.find((p) => p.statusTag !== "postponed")?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateEval(playerId: string, patch: Partial<PlayerEvalState>) {
    setEvals((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], ...patch },
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const evaluations = players
      .filter((p) => p.statusTag !== "expired") // Don't evaluate expired players
      .map((p) => ({
        playerId: p.id,
        sessionId,
        ...evals[p.id],
      }));

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to submit evaluations");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Check className="h-8 w-8" style={{ color: "var(--foreground)" }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Evaluations Submitted</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {players.filter((p) => p.statusTag !== "expired").length} player evaluations recorded.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => window.location.href = "/dashboard/coach/evaluate"}>
              Back to Sessions
            </Button>
            <Button onClick={() => window.location.href = "/dashboard/coach"}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {hasExistingEvals && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24" }}>
          This session already has evaluations. Submitting will add new evaluation records.
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {players.map((player) => {
        const isExpanded = expanded === player.id;
        const ev = evals[player.id];
        const isDisabled = player.statusTag === "expired";
        const sc = STATUS_CONFIG[player.statusTag];
        const StatusIcon = sc.icon;
        const avgScore = Math.round(
          (ev.discipline + ev.technical + ev.tactical + ev.fitness + ev.teamwork) / 5 * 10
        ) / 10;

        return (
          <Card
            key={player.id}
            className={isDisabled ? "opacity-40" : ""}
            style={player.statusTag === "postponed" ? { borderColor: "rgba(255,255,255,0.04)" } : {}}
          >
            <CardContent className="p-0">
              {/* Header row */}
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => !isDisabled && setExpanded(isExpanded ? null : player.id)}
                disabled={isDisabled}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    {player.jerseyNumber ?? player.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {player.firstName} {player.lastName}
                      </p>
                      {player.playerType === "GOALKEEPER" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">GK</Badge>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {player.ageGroup} · #{player.jerseyNumber ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    <StatusIcon className="h-2.5 w-2.5" />
                    {sc.label}
                  </span>
                  {!isDisabled && !isExpanded && (
                    <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      Avg: {avgScore}
                    </span>
                  )}
                  {!isDisabled && (
                    isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  )}
                </div>
              </button>

              {/* Expanded evaluation form */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: "var(--border)" }}>
                      {/* Attendance */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                          Attendance
                        </label>
                        <div className="flex gap-2">
                          {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateEval(player.id, { attendance: status })}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                              style={{
                                background: ev.attendance === status ? "var(--primary)" : "rgba(255,255,255,0.04)",
                                color: ev.attendance === status ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="space-y-3">
                        {SCORE_LABELS.map((key) => (
                          <ScoreSlider
                            key={key}
                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                            value={ev[key as ScoreKey]}
                            onChange={(v) => updateEval(player.id, { [key]: v })}
                          />
                        ))}
                      </div>

                      {/* Notes & Recommendation */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                            Notes
                          </label>
                          <textarea
                            value={ev.notes}
                            onChange={(e) => updateEval(player.id, { notes: e.target.value })}
                            rows={2}
                            placeholder="Performance notes..."
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                            Recommendation
                          </label>
                          <select
                            value={ev.recommendation}
                            onChange={(e) => updateEval(player.id, { recommendation: e.target.value })}
                            className="flex h-10 w-full rounded-lg border border-input bg-[var(--card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">None</option>
                            <option value="PROMOTE">Promote to higher group</option>
                            <option value="MONITOR">Monitor closely</option>
                            <option value="EXTRA_TRAINING">Needs extra training</option>
                            <option value="OUTSTANDING">Outstanding performance</option>
                            <option value="DEMOTE">Consider lower group</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}

      {/* Submit */}
      <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {players.filter((p) => p.statusTag !== "expired").length} players will be evaluated
        </p>
        <Button onClick={handleSubmit} disabled={loading} className="min-w-[160px]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Evaluations
        </Button>
      </div>
    </div>
  );
}

/* ── Score Slider ────────────────────────────────────────────────────────────── */

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{value}/10</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, var(--foreground) ${(value - 1) * 11.1}%, rgba(255,255,255,0.1) ${(value - 1) * 11.1}%)`,
          }}
        />
      </div>
    </div>
  );
}
