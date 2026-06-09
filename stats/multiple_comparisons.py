"""Per-cluster paired analysis with Bonferroni and Benjamini-Hochberg correction.

Running a paired test within each of the 8 clusters produces 8 p-values; without
correction the family-wise error rate inflates. We report both the conservative
Bonferroni adjustment and the less conservative BH FDR control.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from statsmodels.stats.multitest import multipletests

from stats.frequentist import paired_t_test


def per_cluster_analysis(
    deltas: np.ndarray,
    cluster_ids: np.ndarray,
    cluster_names: dict[int, str],
    alpha: float = 0.05,
    min_n: int = 3,
) -> pd.DataFrame:
    """One row per cluster: mean delta, raw + corrected p-values, CI, winner."""
    deltas = np.asarray(deltas, dtype=float)
    records: list[dict] = []
    for cid in sorted(cluster_names):
        sub = deltas[cluster_ids == cid]
        rec: dict = {"cluster_id": cid, "label": cluster_names[cid], "n": int(len(sub))}
        if len(sub) >= min_n and sub.std(ddof=1) > 0:
            t = paired_t_test(sub)
            rec.update(
                mean_delta=t.detail["mean_delta"],
                t_stat=t.statistic,
                p_raw=t.pvalue,
                ci_low=t.ci_low,
                ci_high=t.ci_high,
                cohens_d=t.effect_size,
            )
        else:
            rec.update(
                mean_delta=float(np.mean(sub)) if len(sub) else float("nan"),
                t_stat=float("nan"),
                p_raw=float("nan"),
                ci_low=float("nan"),
                ci_high=float("nan"),
                cohens_d=float("nan"),
            )
        records.append(rec)

    df = pd.DataFrame(records)
    valid = df["p_raw"].notna()
    df["p_bonferroni"] = np.nan
    df["p_bh_fdr"] = np.nan
    pv = df.loc[valid, "p_raw"].to_numpy()
    if len(pv):
        df.loc[valid, "p_bonferroni"] = multipletests(pv, alpha=alpha, method="bonferroni")[1]
        df.loc[valid, "p_bh_fdr"] = multipletests(pv, alpha=alpha, method="fdr_bh")[1]

    df["sig_bonferroni"] = df["p_bonferroni"] < alpha
    df["sig_bh"] = df["p_bh_fdr"] < alpha

    def _winner(r: pd.Series) -> str:
        if pd.isna(r["p_bh_fdr"]):
            return "n/a"
        if r["p_bh_fdr"] < alpha:
            return "B" if r["mean_delta"] > 0 else "A"
        return "tie"

    df["winner"] = df.apply(_winner, axis=1)
    return df.sort_values("cluster_id").reset_index(drop=True)
