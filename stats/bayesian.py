"""Bayesian Beta-Binomial model for 'fraction of jobs where B beats A'.

Each job is a Bernoulli trial: B scores higher than A or it does not. With a
uniform Beta(1,1) prior the posterior is conjugate, so the credible interval and
P(p > 0.5) are available in closed form.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import stats


@dataclass
class BayesResult:
    k: int  # jobs where B > A
    n: int
    post_a: float
    post_b: float
    mean: float  # posterior mean of p = P(B beats A on a job)
    ci_low: float
    ci_high: float
    prob_b_beats_a: float  # P(p > 0.5 | data)

    def posterior_pdf(self, grid: int = 256) -> tuple[np.ndarray, np.ndarray]:
        xs = np.linspace(0.0, 1.0, grid)
        return xs, stats.beta.pdf(xs, self.post_a, self.post_b)


def beta_binomial(
    deltas: np.ndarray,
    prior_a: float = 1.0,
    prior_b: float = 1.0,
    ci: float = 0.95,
) -> BayesResult:
    d = np.asarray(deltas, dtype=float)
    n = int(len(d))
    k = int(np.sum(d > 0))
    post_a = prior_a + k
    post_b = prior_b + (n - k)
    lo = float(stats.beta.ppf((1 - ci) / 2, post_a, post_b))
    hi = float(stats.beta.ppf(1 - (1 - ci) / 2, post_a, post_b))
    prob_b = float(stats.beta.sf(0.5, post_a, post_b))  # P(p > 0.5)
    return BayesResult(
        k=k, n=n, post_a=post_a, post_b=post_b,
        mean=float(post_a / (post_a + post_b)),
        ci_low=lo, ci_high=hi, prob_b_beats_a=prob_b,
    )
