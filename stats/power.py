"""Power analysis for the paired design: required N, achieved power, MDE table."""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.stats.power import TTestPower

_ANALYSIS = TTestPower()


def required_sample_size(effect_size: float, alpha: float = 0.05, power: float = 0.8) -> float:
    """Minimum number of paired observations to detect ``effect_size`` (Cohen's d)."""
    if effect_size == 0:
        return float("inf")
    return float(
        _ANALYSIS.solve_power(
            effect_size=abs(effect_size), alpha=alpha, power=power, alternative="two-sided"
        )
    )


def achieved_power(n: int, effect_size: float, alpha: float = 0.05) -> float:
    """Power actually achieved at the observed effect size and sample size.

    Uses ``.power()`` (direct computation) rather than ``solve_power`` (a
    root-finder that returns NaN when power saturates near 1.0)."""
    if effect_size == 0 or n < 2:
        return float(alpha)
    val = _ANALYSIS.power(
        effect_size=abs(effect_size), nobs=n, alpha=alpha, alternative="two-sided"
    )
    if not np.isfinite(val):
        # scipy's noncentral-t saturates (NaN) at large noncentrality; the
        # large-sample normal approximation is effectively exact here.
        ncp = abs(effect_size) * np.sqrt(n)
        z = stats.norm.ppf(1 - alpha / 2)
        val = stats.norm.sf(z - ncp) + stats.norm.cdf(-z - ncp)
    return float(min(val, 1.0))


def minimum_detectable_effect(n: int, alpha: float = 0.05, power: float = 0.8) -> float:
    """Smallest Cohen's d detectable at the given N, alpha and power."""
    if n < 2:
        return float("inf")
    return float(_ANALYSIS.solve_power(nobs=n, alpha=alpha, power=power, alternative="two-sided"))


def mde_table(
    n: int,
    alphas: tuple[float, ...] = (0.01, 0.05, 0.10),
    powers: tuple[float, ...] = (0.80, 0.90, 0.95),
) -> pd.DataFrame:
    """MDE (in Cohen's d) over an alpha x power grid — a recruiter-friendly table."""
    rows = []
    for power in powers:
        row: dict[str, float] = {"power": power}
        for alpha in alphas:
            row[f"alpha={alpha:g}"] = round(
                minimum_detectable_effect(n, alpha=alpha, power=power), 4
            )
        rows.append(row)
    return pd.DataFrame(rows)
