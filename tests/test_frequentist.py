from __future__ import annotations

import numpy as np

from stats.frequentist import (
    bootstrap_ci,
    choose_and_test,
    cohens_d,
    paired_t_test,
    wilcoxon_signed_rank,
)
from tests.conftest import make_deltas


def test_cohens_d_known():
    d = make_deltas(1.0, 2.0, 50000, seed=1)
    assert abs(cohens_d(d) - 0.5) < 0.03


def test_paired_t_detects_positive(deltas_positive):
    res = paired_t_test(deltas_positive)
    assert res.pvalue < 1e-3
    assert res.ci_low > 0
    assert res.effect_size > 0.2


def test_paired_t_null_not_significant(deltas_null):
    res = paired_t_test(deltas_null)
    assert res.pvalue > 0.05
    assert res.ci_low < 0 < res.ci_high


def test_bootstrap_brackets_mean(deltas_positive):
    boot = bootstrap_ci(deltas_positive, n_resamples=2000)
    assert boot.pct_low < boot.point < boot.pct_high
    assert np.isfinite(boot.bca_low) and np.isfinite(boot.bca_high)
    assert boot.bca_low > 0  # positive effect excludes zero


def test_choose_picks_wilcoxon_on_skew(deltas_skewed):
    primary, normality = choose_and_test(deltas_skewed)
    assert normality.detail["normal_at_05"] is False
    assert primary.name == "Wilcoxon signed-rank"


def test_choose_picks_t_on_normal(deltas_positive):
    primary, _ = choose_and_test(deltas_positive)
    assert primary.name == "Paired t-test"


def test_wilcoxon_runs(deltas_positive):
    res = wilcoxon_signed_rank(deltas_positive)
    assert 0 <= res.pvalue <= 1
