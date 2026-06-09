"""mSPRT — Robbins's mixture Sequential Probability Ratio Test (Robbins, 1970).

Tests H0: mean(delta) = 0 with a normal mixture prior N(0, tau^2) on the
alternative mean. The mixture likelihood ratio after n observations is

    Lambda_n = sqrt(s2 / (s2 + n*tau2))
             * exp( n^2 * tau2 * xbar_n^2 / (2 * s2 * (s2 + n*tau2)) )

and p_n = min(1, 1/Lambda_n) is an *always-valid* p-value: taking the running
minimum lets you peek at any sample size without inflating Type I error. In the
static-snapshot product all jobs are scored at once, so this is shown as a
"valid at any n" alternative p-value rather than an operational stopping rule.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class SequentialResult:
    lambda_n: float
    always_valid_p: float
    reject_h0: bool
    sigma2: float
    tau2: float
    n: int
    trajectory_p: np.ndarray  # running always-valid p-value at each n (for plotting)


def msprt(
    deltas: np.ndarray,
    alpha: float = 0.05,
    tau2: float | None = None,
    sigma2: float | None = None,
) -> SequentialResult:
    d = np.asarray(deltas, dtype=float)
    n = len(d)
    s2 = float(d.var(ddof=1)) if sigma2 is None else float(sigma2)
    s2 = max(s2, 1e-12)
    t2 = s2 if tau2 is None else float(tau2)  # mixture scale ~ plausible effect size

    ns = np.arange(1, n + 1)
    xbar = np.cumsum(d) / ns
    factor = np.sqrt(s2 / (s2 + ns * t2))
    expo = np.clip((ns**2 * t2 * xbar**2) / (2.0 * s2 * (s2 + ns * t2)), 0, 700)
    lam = factor * np.exp(expo)

    inst_p = np.minimum(1.0, 1.0 / lam)
    always_valid = np.minimum.accumulate(inst_p)
    return SequentialResult(
        lambda_n=float(lam[-1]),
        always_valid_p=float(always_valid[-1]),
        reject_h0=bool(always_valid[-1] < alpha),
        sigma2=s2,
        tau2=t2,
        n=n,
        trajectory_p=always_valid,
    )
