/**
 * Compute overall rating from individual evaluation scores.
 * Used to generate FIFA-style player cards.
 */

export interface PlayerStats {
  discipline: number;
  technical: number;
  tactical: number;
  fitness: number;
  teamwork: number;
}

export interface GKStats {
  gkDiving?: number;
  gkHandling?: number;
  gkKicking?: number;
  gkReflexes?: number;
  gkPositioning?: number;
}

/**
 * Compute an overall rating (1-99) from evaluation averages.
 * Maps 1-10 scale evaluations to a FIFA-like 40-99 range.
 */
export function computeOverall(stats: PlayerStats): number {
  const { discipline, technical, tactical, fitness, teamwork } = stats;
  const avg = (discipline + technical + tactical + fitness + teamwork) / 5;
  // Map 1-10 → 40-99
  const overall = Math.round(40 + (avg - 1) * (59 / 9));
  return Math.max(40, Math.min(99, overall));
}

/**
 * Compute GK overall from GK-specific stats, falling back to outfield if not available.
 */
export function computeGKOverall(gk: GKStats, outfield: PlayerStats): number {
  const gkValues = [gk.gkDiving, gk.gkHandling, gk.gkKicking, gk.gkReflexes, gk.gkPositioning].filter(
    (v): v is number => v !== undefined && v !== null
  );

  if (gkValues.length === 0) {
    return computeOverall(outfield);
  }

  const avg = gkValues.reduce((s, v) => s + v, 0) / gkValues.length;
  return Math.max(40, Math.min(99, Math.round(40 + (avg - 1) * (59 / 9))));
}

/**
 * Map 1-10 scores to FIFA card display stats (40-99 range).
 */
export function mapToCardStat(value: number): number {
  return Math.max(40, Math.min(99, Math.round(40 + (value - 1) * (59 / 9))));
}

/**
 * Average multiple evaluations into a single stats object.
 */
export function averageEvaluations(
  evaluations: PlayerStats[]
): PlayerStats {
  if (evaluations.length === 0) {
    return { discipline: 5, technical: 5, tactical: 5, fitness: 5, teamwork: 5 };
  }

  const sum = evaluations.reduce(
    (acc, ev) => ({
      discipline: acc.discipline + ev.discipline,
      technical: acc.technical + ev.technical,
      tactical: acc.tactical + ev.tactical,
      fitness: acc.fitness + ev.fitness,
      teamwork: acc.teamwork + ev.teamwork,
    }),
    { discipline: 0, technical: 0, tactical: 0, fitness: 0, teamwork: 0 }
  );

  const n = evaluations.length;
  return {
    discipline: Math.round((sum.discipline / n) * 10) / 10,
    technical: Math.round((sum.technical / n) * 10) / 10,
    tactical: Math.round((sum.tactical / n) * 10) / 10,
    fitness: Math.round((sum.fitness / n) * 10) / 10,
    teamwork: Math.round((sum.teamwork / n) * 10) / 10,
  };
}

/** Rating label based on overall */
export function ratingLabel(overall: number): string {
  if (overall >= 90) return "World Class";
  if (overall >= 80) return "Excellent";
  if (overall >= 70) return "Good";
  if (overall >= 60) return "Average";
  if (overall >= 50) return "Developing";
  return "Beginner";
}
