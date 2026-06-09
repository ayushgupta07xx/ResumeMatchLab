"""Frequentist core: normality-gated paired test, bootstrap CIs, effect size.

All functions operate on the paired-delta vector ``d_i = score_B_i - score_A_i``.
A paired t-test on A vs B is exactly a one-sample t-test of the deltas against 0.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import stats

from core.types import TestResult

RNG_SEED = 42


def cohens_d(deltas: np.ndarray) -> float:
    """Paired Cohen's d = mean(delta) / sd(delta). Small/med/large = 0.2/0.5/0.8."""
    d = np.asarray(deltas, dtype=float)
    sd = d.std(ddof=1)
    return float(d.mean() / sd) if sd > 0 else 0.0


def shapiro_normality(deltas: np.ndarray) -> TestResult:
    """Shapiro-Wilk on deltas; subsamples above 5000 (the test saturates there)."""
    d = np.asarray(deltas, dtype=float)
    sample = d
    if len(d) > 5000:
        rng = np.random.default_rng(RNG_SEED)
        sample = rng.choice(d, 5000, replace=False)
    if len(sample) < 3:
        return TestResult("Shapiro-Wilk normality", 0.0, 1.0,
                          detail={"normal_at_05": True, "n_used": len(sample)})
    w, p = stats.shapiro(sample)
    return TestResult(
        name="Shapiro-Wilk normality",
        statistic=float(w),
        pvalue=float(p),
        detail={"n_used": int(len(sample)), "normal_at_05": bool(p > 0.05)},
    )


def paired_t_test(deltas: np.ndarray) -> TestResult:
    """Paired t-test (one-sample t on deltas) with a parametric 95% CI."""
    d = np.asarray(deltas, dtype=float)
    n = len(d)
    mean = d.mean()
    se = d.std(ddof=1) / np.sqrt(n) if n > 1 else 0.0
    df = n - 1
    t = mean / se if se > 0 else 0.0
    p = float(2 * stats.t.sf(abs(t), df)) if se > 0 else 1.0
    tcrit = stats.t.ppf(0.975, df) if df > 0 else 0.0
    return TestResult(
        name="Paired t-test",
        statistic=float(t),
        pvalue=p,
        df=float(df),
        ci_low=float(mean - tcrit * se),
        ci_high=float(mean + tcrit * se),
        effect_size=cohens_d(d),
        detail={"mean_delta": float(mean), "n": int(n), "se": float(se)},
    )


def wilcoxon_signed_rank(deltas: np.ndarray) -> TestResult:
    """Distribution-free paired test. Hodges-Lehmann pseudo-median as the point."""
    d = np.asarray(deltas, dtype=float)
    nz = d[d != 0]
    if len(nz) == 0:
        return TestResult("Wilcoxon signed-rank", 0.0, 1.0,
                          detail={"note": "all deltas zero", "n_nonzero": 0})
    res = stats.wilcoxon(nz, zero_method="wilcox", correction=False,
                         alternative="two-sided", method="auto")
    return TestResult(
        name="Wilcoxon signed-rank",
        statistic=float(res.statistic),
        pvalue=float(res.pvalue),
        effect_size=cohens_d(d),
        detail={"n_nonzero": int(len(nz)), "median_delta": float(np.median(d))},
    )


@dataclass
class BootstrapCI:
    point: float
    pct_low: float
    pct_high: float
    bca_low: float
    bca_high: float
    n_resamples: int


def bootstrap_ci(
    deltas: np.ndarray,
    n_resamples: int = 10000,
    ci: float = 0.95,
    seed: int = RNG_SEED,
) -> BootstrapCI:
    """Percentile + BCa (bias-corrected, accelerated) bootstrap CI for mean delta."""
    d = np.asarray(deltas, dtype=float)
    n = len(d)
    theta_hat = float(d.mean())
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, n, size=(n_resamples, n))
    boot = d[idx].mean(axis=1)

    alpha = 1.0 - ci
    pct_low = float(np.percentile(boot, 100 * alpha / 2))
    pct_high = float(np.percentile(boot, 100 * (1 - alpha / 2)))

    # BCa: bias-correction z0 + jackknife acceleration a.
    prop = np.mean(boot < theta_hat)
    prop = min(max(prop, 1.0 / (n_resamples + 1)), 1.0 - 1.0 / (n_resamples + 1))
    z0 = stats.norm.ppf(prop)
    jack = (d.sum() - d) / (n - 1)
    diff = jack.mean() - jack
    denom = 6.0 * (np.sum(diff**2) ** 1.5) + 1e-12
    a = float(np.sum(diff**3) / denom)

    def _adj(z: float) -> float:
        val = z0 + (z0 + z) / (1 - a * (z0 + z))
        return float(stats.norm.cdf(val))

    z_lo, z_hi = stats.norm.ppf(alpha / 2), stats.norm.ppf(1 - alpha / 2)
    bca_low = float(np.percentile(boot, 100 * _adj(z_lo)))
    bca_high = float(np.percentile(boot, 100 * _adj(z_hi)))
    return BootstrapCI(theta_hat, pct_low, pct_high, bca_low, bca_high, n_resamples)


def choose_and_test(deltas: np.ndarray) -> tuple[TestResult, TestResult]:
    """Pick t-test vs Wilcoxon by a Shapiro-Wilk normality gate. Returns
    ``(primary_test, normality_test)``."""
    normality = shapiro_normality(deltas)
    if normality.detail.get("normal_at_05", True):
        return paired_t_test(deltas), normality
    return wilcoxon_signed_rank(deltas), normality
