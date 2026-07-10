import type { CompareResponse } from "@/lib/types";

// Illustrative verdict examples for the home-page carousel. NOT real
// measurements — they show the product's output FORMAT with internally coherent
// numbers (win-rate, delta, CI, d, confidence all consistent, as a real run
// would produce). The real analysis runs on /results when a user compares.
function make(
  winner: "A" | "B",
  pctB: number,
  deltaPts: number,
  ci: [number, number],
  d: number,
  conf: "high" | "moderate",
  meanA: number,
  meanB: number,
): CompareResponse {
  return {
    verdict: {
      winner,
      headline: `Résumé ${winner} wins by ${Math.abs(deltaPts).toFixed(2)} points`,
      confidence: conf,
      significant: conf === "high",
      mean_delta: deltaPts / 100,
      mean_delta_points: deltaPts,
      ci_points: ci,
      p_value: conf === "high" ? 0 : 0.012,
      cohens_d: d,
    },
    summary: {
      mean_a: meanA,
      mean_b: meanB,
      mean_delta: deltaPts / 100,
      std_delta: 0.045,
      pct_jobs_b_wins: pctB,
      n_jobs: 9014,
    },
  } as CompareResponse;
}

export const DEMO_VARIANTS: CompareResponse[] = [
  make("A", 28.6, -2.01, [-2.12, -1.91], -0.41, "high", 0.6446, 0.6245),
  make("B", 63.0, 1.44, [1.31, 1.57], 0.29, "high", 0.6180, 0.6324),
  make("B", 81.2, 3.10, [2.94, 3.26], 0.62, "high", 0.6090, 0.6400),
  make("A", 41.5, -0.72, [-0.85, -0.59], -0.18, "moderate", 0.6310, 0.6238),
  make("B", 74.0, 2.30, [2.15, 2.45], 0.52, "high", 0.6150, 0.6380),
];
