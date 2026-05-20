"use client";

import { motion } from "framer-motion";
import { mapToCardStat, computeOverall, ratingLabel } from "@/lib/player-rating";
import type { PlayerStats } from "@/lib/player-rating";

interface FifaCardProps {
  firstName: string;
  lastName: string;
  position: string;
  ageGroup: string;
  jerseyNumber: number | null;
  playerType: string;
  stats: PlayerStats;
  compact?: boolean;
}

const STAT_LABELS: { key: keyof PlayerStats; short: string }[] = [
  { key: "discipline", short: "DIS" },
  { key: "technical", short: "TEC" },
  { key: "tactical", short: "TAC" },
  { key: "fitness", short: "FIT" },
  { key: "teamwork", short: "TWK" },
];

export function FifaCard({
  firstName, lastName, position, ageGroup, jerseyNumber,
  playerType, stats, compact = false,
}: FifaCardProps) {
  const overall = computeOverall(stats);
  const label = ratingLabel(overall);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border ${compact ? "w-48" : "w-64"}`}
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: "rgba(255,255,255,0.3)" }} />

      <div className={`${compact ? "p-4" : "p-5"} space-y-3`}>
        {/* Rating & position */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`${compact ? "text-3xl" : "text-4xl"} font-black leading-none`} style={{ color: "var(--foreground)" }}>
              {overall}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              {position || (playerType === "GOALKEEPER" ? "GK" : "MID")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{ageGroup}</p>
            {jerseyNumber && (
              <p className="text-lg font-black" style={{ color: "rgba(255,255,255,0.2)" }}>
                #{jerseyNumber}
              </p>
            )}
          </div>
        </div>

        {/* Player avatar */}
        <div className="flex justify-center">
          <div
            className={`flex items-center justify-center rounded-full ${compact ? "h-16 w-16 text-xl" : "h-20 w-20 text-2xl"} font-black`}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
              color: "var(--foreground)",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          >
            {firstName[0]}{lastName[0]}
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <p className={`${compact ? "text-sm" : "text-base"} font-black uppercase tracking-wide`} style={{ color: "var(--foreground)" }}>
            {lastName}
          </p>
          <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>
            {firstName} · {label}
          </p>
        </div>

        {/* Stats */}
        <div className="border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className={`grid ${compact ? "grid-cols-5 gap-1" : "grid-cols-5 gap-2"}`}>
            {STAT_LABELS.map(({ key, short }) => {
              const val = mapToCardStat(stats[key]);
              return (
                <div key={key} className="text-center">
                  <p className={`${compact ? "text-sm" : "text-base"} font-black`} style={{ color: "var(--foreground)" }}>
                    {val}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    {short}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* GK badge */}
        {playerType === "GOALKEEPER" && (
          <div className="absolute right-3 top-3">
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
              style={{ background: "rgba(255,255,255,0.12)", color: "var(--foreground)" }}>
              GK
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
