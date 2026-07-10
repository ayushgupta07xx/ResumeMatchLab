import type { CompareResponse } from "@/lib/types";

// Canonical reference run (Sample DevOps résumé A vs Sample Data-Scientist B),
// validated against a simulated cohort. These are the same numbers the results
// page shows for the bundled demo pair — the home-page card reuses ResultVerdict
// so the two surfaces can never drift. Only the fields ResultVerdict reads
// (verdict + summary) carry real values; the rest satisfy the type shape.
export const DEMO_RESULT = {
  verdict: {
    winner: "A",
    headline: "Résumé A wins by 2.01 points",
    confidence: "high",
    significant: true,
    mean_delta: -0.0201,
    mean_delta_points: -2.01,
    ci_points: [-2.12, -1.91],
    p_value: 0,
    cohens_d: -0.41,
  },
  summary: {
    mean_a: 0.6446,
    mean_b: 0.6245,
    mean_delta: -0.0201,
    std_delta: 0.0453,
    pct_jobs_b_wins: 28.6,
    n_jobs: 9014,
  },
} as CompareResponse;
