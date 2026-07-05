import type { CompareResponse, Confidence, Winner } from "./types";

export const fmtPct = (x: number, d = 1) => `${x.toFixed(d)}%`;

export function fmtPts(x: number, d = 2, signed = false) {
  const s = x.toFixed(d);
  return signed && x > 0 ? `+${s}` : s;
}

export function fmtP(p: number | null) {
  if (p === null) return "—";
  if (p < 1e-4) return p.toExponential(1);
  return p.toFixed(p < 0.01 ? 4 : 3);
}

/** Share of jobs each resume out-scores the other on. */
export function winRates(summary: CompareResponse["summary"]) {
  const bWins = summary.pct_jobs_b_wins;
  return { aWins: 100 - bWins, bWins };
}

/** Relative edge = |Δ mean| ÷ the losing resume's mean, as a percent. */
export function relativeEdge(summary: CompareResponse["summary"], winner: Winner) {
  if (winner === "tie") return null;
  const loserMean = winner === "A" ? summary.mean_b : summary.mean_a;
  if (!loserMean) return null;
  return (Math.abs(summary.mean_delta) / loserMean) * 100;
}

// Neutral strength meter — deliberately not red/green (those mean A/B only).
export const CONFIDENCE_DOTS: Record<Confidence, string> = {
  high: "●●●",
  moderate: "●●○",
  low: "●○○",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
};
