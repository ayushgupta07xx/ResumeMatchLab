// Mirrors apps/api/serialize.py:report_to_dict — the single render contract.

export type Winner = "A" | "B" | "tie";
export type Confidence = "high" | "moderate" | "low";

export interface Verdict {
  winner: Winner;
  headline: string;
  confidence: Confidence;
  significant: boolean;
  mean_delta: number | null;
  mean_delta_points: number | null;
  ci_points: [number | null, number | null];
  p_value: number | null;
  cohens_d: number | null;
}

export interface Summary {
  mean_a: number;
  mean_b: number;
  mean_delta: number; // B - A
  std_delta: number;
  pct_jobs_b_wins: number; // % of jobs where B out-scores A
  n_jobs: number;
}

export interface Tests {
  primary: {
    name: string;
    statistic: number | null;
    pvalue: number | null;
    ci_low: number | null;
    ci_high: number | null;
  };
  normality: {
    name: string;
    statistic: number | null;
    pvalue: number | null;
    normal_at_05: boolean;
  };
  cuped_test: {
    name: string;
    pvalue: number | null;
    ci_low: number | null;
    ci_high: number | null;
  };
}

export interface Effect {
  cohens_d: number | null;
  achieved_power: number | null;
  required_n_80: number | null;
  mde: Array<Record<string, number>>;
}

export interface Bootstrap {
  point: number | null;
  percentile: [number | null, number | null];
  bca: [number | null, number | null];
  n_resamples: number;
}

export interface Cuped {
  variance_reduction: number | null;
  r_squared: number | null;
  effective_n_multiplier: number | null;
  n_covariates: number;
}

export interface Sequential {
  always_valid_p: number | null;
  reject_h0: boolean;
  n: number;
  trajectory: Array<{ n: number; p: number }>;
}

export interface Bayes {
  k: number;
  n: number;
  posterior_mean: number | null;
  credible_interval: [number | null, number | null];
  prob_b_beats_a: number | null;
  posterior_curve: Array<{ p: number; density: number }>;
}

export interface Distributions {
  bin_centers: number[];
  resume_a: number[];
  resume_b: number[];
}

export interface ClusterRow {
  cluster_id: number;
  label: string;
  n: number;
  mean_delta: number | null;
  ci_low: number | null;
  ci_high: number | null;
  p_raw: number | null;
  p_bonferroni: number | null;
  p_bh_fdr: number | null;
  sig_bonferroni: boolean;
  sig_bh: boolean;
  winner: string;
  gaps?: { skill: string; freq: number }[];
  differentiators?: {
    a_favoring: { skill: string; freq: number }[];
    b_favoring: { skill: string; freq: number }[];
  };
}

export interface InputMeta {
  chars: number;
  format: string;
  parser: string;
  skills: string[];
  parse_quality: number;
  flags: string[];
}

export interface CompareResponse {
  verdict: Verdict;
  summary: Summary;
  tests: Tests;
  effect: Effect;
  bootstrap: Bootstrap;
  cuped: Cuped;
  sequential: Sequential;
  bayes: Bayes;
  distributions: Distributions;
  clusters: ClusterRow[];
  inputs?: { resume_a: InputMeta; resume_b: InputMeta };
}
