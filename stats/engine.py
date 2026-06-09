"""Decision engine: run every analysis and synthesize one verdict.

Combines the frequentist test, bootstrap CI, power analysis, CUPED, mSPRT,
Bayesian posterior, and per-cluster correction into an ``AnalysisReport`` that
the Streamlit UI and the PDF report both render.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from core.data import JobCorpus
from core.types import ScoringResult, TestResult
from stats.bayesian import BayesResult, beta_binomial
from stats.cuped import CupedResult, build_job_covariates, cuped_adjust
from stats.frequentist import (
    BootstrapCI,
    bootstrap_ci,
    choose_and_test,
    cohens_d,
    paired_t_test,
)
from stats.multiple_comparisons import per_cluster_analysis
from stats.power import achieved_power, mde_table, required_sample_size
from stats.sequential import SequentialResult, msprt


@dataclass
class Verdict:
    winner: str  # "A" | "B" | "tie"
    mean_delta: float
    ci_low: float
    ci_high: float
    p_value: float
    significant: bool
    cohens_d: float
    confidence: str  # "high" | "moderate" | "low"
    headline: str


@dataclass
class AnalysisReport:
    n_jobs: int
    primary_test: TestResult
    normality: TestResult
    bootstrap: BootstrapCI
    cohens_d: float
    required_n_80: float
    achieved_power: float
    mde: pd.DataFrame
    cuped: CupedResult
    cuped_test: TestResult
    sequential: SequentialResult
    bayes: BayesResult
    per_cluster: pd.DataFrame
    verdict: Verdict
    scores_summary: dict


def _confidence(p: float, prob_b: float) -> str:
    extreme = max(prob_b, 1 - prob_b)
    if p < 0.01 and extreme > 0.99:
        return "high"
    if p < 0.05 and extreme > 0.95:
        return "moderate"
    return "low"


def build_verdict(
    deltas: np.ndarray,
    primary: TestResult,
    bootstrap: BootstrapCI,
    bayes: BayesResult,
) -> Verdict:
    mean = float(np.mean(deltas))
    p = primary.pvalue
    ci_excludes_zero = not (bootstrap.bca_low <= 0.0 <= bootstrap.bca_high)
    significant = (p < 0.05) and ci_excludes_zero

    winner = "tie"
    if significant and mean > 0:
        winner = "B"
    elif significant and mean < 0:
        winner = "A"

    d = cohens_d(deltas)
    conf = _confidence(p, bayes.prob_b_beats_a)
    lo, hi = bootstrap.bca_low * 100, bootstrap.bca_high * 100  # cosine pts -> "points"

    if winner == "tie":
        headline = (
            f"No decisive winner: B differs from A by {mean * 100:+.2f} points "
            f"(95% CI [{lo:.2f}, {hi:.2f}], p={p:.3g}) — the interval includes zero."
        )
    else:
        headline = (
            f"Resume {winner} wins by {abs(mean) * 100:.2f} points "
            f"(95% CI [{lo:.2f}, {hi:.2f}], p={p:.3g})."
        )
    return Verdict(winner, mean, bootstrap.bca_low, bootstrap.bca_high, p,
                   significant, d, conf, headline)


def analyze(scoring: ScoringResult, corpus: JobCorpus) -> AnalysisReport:
    """Full pipeline on one A-vs-B scoring result."""
    deltas = scoring.deltas
    n = scoring.n_jobs

    primary, normality = choose_and_test(deltas)
    boot = bootstrap_ci(deltas)
    d = cohens_d(deltas)
    req_n = required_sample_size(d)
    power = achieved_power(n, d)
    mde = mde_table(n)

    desc_len = corpus.jobs["description"].fillna("").str.len().to_numpy(dtype=float)
    covariates = build_job_covariates(scoring.cluster_ids, desc_len)
    cuped = cuped_adjust(deltas, covariates)
    cuped_test = paired_t_test(cuped.adjusted)

    sequential = msprt(deltas)
    bayes = beta_binomial(deltas)
    per_cluster = per_cluster_analysis(deltas, scoring.cluster_ids, corpus.cluster_names)
    verdict = build_verdict(deltas, primary, boot, bayes)

    scores_summary = {
        "mean_a": float(scoring.scores_a.mean()),
        "mean_b": float(scoring.scores_b.mean()),
        "mean_delta": float(deltas.mean()),
        "std_delta": float(deltas.std(ddof=1)),
        "pct_jobs_b_wins": float(np.mean(deltas > 0) * 100),
    }

    return AnalysisReport(
        n_jobs=n,
        primary_test=primary,
        normality=normality,
        bootstrap=boot,
        cohens_d=d,
        required_n_80=req_n,
        achieved_power=power,
        mde=mde,
        cuped=cuped,
        cuped_test=cuped_test,
        sequential=sequential,
        bayes=bayes,
        per_cluster=per_cluster,
        verdict=verdict,
        scores_summary=scores_summary,
    )
