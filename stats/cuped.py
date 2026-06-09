"""CUPED variance reduction (Deng et al., 2013) via regression residualization.

The unit of observation is a *job*, so variance-reducing covariates must vary
across jobs and be independent of the A-vs-B contrast. We use job-side covariates
— cluster membership (one-hot) and job-description length — not the resume-level
covariates named in the original spec (those are constant across jobs and cannot
reduce within-experiment variance). For the regression adjustment, the achieved
variance reduction equals the R^2 of the covariate regression.

    delta_adj_i = delta_i - X_i.beta + mean(delta)
    variance_reduction = 1 - var(delta_adj) / var(delta) = R^2
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class CupedResult:
    adjusted: np.ndarray
    variance_reduction: float  # == R^2 of the covariate regression
    r_squared: float
    n_covariates: int
    effective_n_multiplier: float  # 1 / (1 - variance_reduction)


def cuped_adjust(deltas: np.ndarray, covariates: np.ndarray) -> CupedResult:
    """Residualize ``deltas`` on ``covariates`` (intercept added automatically)."""
    y = np.asarray(deltas, dtype=float)
    x = np.asarray(covariates, dtype=float)
    if x.ndim == 1:
        x = x[:, None]
    # Drop zero-variance columns (e.g. an absent cluster) to keep the design full-rank.
    if x.shape[1]:
        keep = x.std(axis=0) > 0
        x = x[:, keep]
    design = np.column_stack([np.ones(len(y)), x]) if x.shape[1] else np.ones((len(y), 1))

    beta, *_ = np.linalg.lstsq(design, y, rcond=None)
    fitted = design @ beta
    resid = y - fitted
    adjusted = resid + y.mean()

    var_y = y.var(ddof=1)
    vr = float(1 - adjusted.var(ddof=1) / var_y) if var_y > 0 else 0.0
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    r2 = float(1 - np.sum(resid**2) / ss_tot) if ss_tot > 0 else 0.0
    vr = max(0.0, vr)
    mult = 1.0 / (1.0 - vr) if vr < 1 else float("inf")
    return CupedResult(adjusted, vr, r2, int(x.shape[1]), mult)


def build_job_covariates(cluster_ids: np.ndarray, description_lengths: np.ndarray) -> np.ndarray:
    """Job-side covariate matrix: cluster one-hot (drop-first) + z(desc length)."""
    cl = np.asarray(cluster_ids)
    uniq = sorted({int(c) for c in cl})
    if len(uniq) > 1:
        onehot = np.stack([(cl == c).astype(float) for c in uniq[1:]], axis=1)
    else:
        onehot = np.zeros((len(cl), 0))

    desc = np.asarray(description_lengths, dtype=float)
    sd = desc.std()
    z = (desc - desc.mean()) / sd if sd > 0 else np.zeros_like(desc)

    if onehot.shape[1]:
        return np.column_stack([onehot, z])
    return z[:, None]
