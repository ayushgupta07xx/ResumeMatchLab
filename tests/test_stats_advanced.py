from __future__ import annotations

import numpy as np

from stats.bayesian import beta_binomial
from stats.cuped import build_job_covariates, cuped_adjust
from stats.power import achieved_power, minimum_detectable_effect, required_sample_size
from stats.sequential import msprt
from tests.conftest import make_deltas


# ---- CUPED ----
def test_cuped_reduces_variance_with_predictive_covariate():
    rng = np.random.default_rng(0)
    cluster_ids = rng.integers(0, 8, 2000)
    # delta depends strongly on cluster -> covariate explains variance
    base = np.array([-0.05, -0.02, 0.0, 0.01, 0.02, 0.03, 0.05, 0.08])
    deltas = base[cluster_ids] + rng.normal(0, 0.02, 2000)
    desc_len = rng.normal(1500, 400, 2000)
    cov = build_job_covariates(cluster_ids, desc_len)
    res = cuped_adjust(deltas, cov)
    assert res.variance_reduction > 0.3
    assert res.effective_n_multiplier > 1.4
    # mean is preserved by construction
    assert abs(res.adjusted.mean() - deltas.mean()) < 1e-9


def test_cuped_no_reduction_when_unrelated():
    rng = np.random.default_rng(1)
    deltas = rng.normal(0.01, 0.1, 2000)
    cluster_ids = rng.integers(0, 8, 2000)  # unrelated to deltas
    cov = build_job_covariates(cluster_ids, rng.normal(0, 1, 2000))
    res = cuped_adjust(deltas, cov)
    assert res.variance_reduction < 0.05


# ---- Power ----
def test_power_monotonic():
    assert required_sample_size(0.2) > required_sample_size(0.5)
    assert achieved_power(2000, 0.2) > achieved_power(200, 0.2)
    assert 0 < minimum_detectable_effect(2000) < minimum_detectable_effect(200)


# ---- Sequential mSPRT ----
def test_msprt_rejects_strong_effect():
    d = make_deltas(0.03, 0.1, 2000, seed=42)
    res = msprt(d)
    assert res.reject_h0 is True
    assert res.always_valid_p < 0.05
    assert len(res.trajectory_p) == len(d)


def test_msprt_controls_type_i_error():
    # The defining property of always-valid inference: across many null runs,
    # P(ever reject) <= alpha. A single null run MAY reject (with prob <= alpha),
    # so we check the aggregate error rate, not one sequence.
    sims = 300
    rejects = sum(
        msprt(make_deltas(0.0, 0.1, 1000, seed=1000 + s), alpha=0.05).reject_h0 for s in range(sims)
    )
    assert rejects / sims <= 0.08  # ~alpha = 0.05 with Monte Carlo slack


# ---- Bayesian ----
def test_bayes_all_b_wins():
    d = np.full(500, 0.02)
    res = beta_binomial(d)
    assert res.k == 500
    assert res.prob_b_beats_a > 0.99
    assert res.ci_low > 0.9


def test_bayes_symmetric():
    d = np.concatenate([np.full(500, 0.01), np.full(500, -0.01)])
    res = beta_binomial(d)
    assert abs(res.mean - 0.5) < 0.02
    assert abs(res.prob_b_beats_a - 0.5) < 0.05
    assert res.ci_low < res.mean < res.ci_high
