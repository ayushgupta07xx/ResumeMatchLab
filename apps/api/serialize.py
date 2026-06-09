"""Serialize an ``AnalysisReport`` into a frontend-ready JSON dict.

Everything a UI needs to render the verdict and every chart — forest plot,
score-distribution histograms, Bayesian posterior curve, mSPRT trajectory — is
pre-computed here so the client needs no numerical libraries.
"""

from __future__ import annotations

import numpy as np


def _f(x) -> float | None:
    """Cast to a JSON-safe float, mapping NaN/None to null."""
    try:
        if x is None:
            return None
        xf = float(x)
        return None if np.isnan(xf) else xf
    except (TypeError, ValueError):
        return None


def report_to_dict(report, scoring, resume_a=None, resume_b=None) -> dict:
    v = report.verdict
    boot = report.bootstrap

    clusters = []
    for _, r in report.per_cluster.iterrows():
        clusters.append(
            {
                "cluster_id": int(r["cluster_id"]),
                "label": str(r["label"]),
                "n": int(r["n"]),
                "mean_delta": _f(r["mean_delta"]),
                "ci_low": _f(r["ci_low"]),
                "ci_high": _f(r["ci_high"]),
                "p_raw": _f(r["p_raw"]),
                "p_bonferroni": _f(r["p_bonferroni"]),
                "p_bh_fdr": _f(r["p_bh_fdr"]),
                "sig_bonferroni": bool(r["sig_bonferroni"]),
                "sig_bh": bool(r["sig_bh"]),
                "winner": str(r["winner"]),
            }
        )

    lo = float(min(scoring.scores_a.min(), scoring.scores_b.min()))
    hi = float(max(scoring.scores_a.max(), scoring.scores_b.max()))
    edges = np.linspace(lo, hi, 41)
    a_counts, _ = np.histogram(scoring.scores_a, bins=edges)
    b_counts, _ = np.histogram(scoring.scores_b, bins=edges)
    centers = (edges[:-1] + edges[1:]) / 2

    xs, pdf = report.bayes.posterior_pdf(128)

    traj = report.sequential.trajectory_p
    idx = np.unique(np.linspace(0, len(traj) - 1, 200).astype(int))
    sequential_points = [{"n": int(i + 1), "p": float(traj[i])} for i in idx]

    out = {
        "verdict": {
            "winner": v.winner,
            "headline": v.headline,
            "confidence": v.confidence,
            "significant": bool(v.significant),
            "mean_delta": _f(v.mean_delta),
            "mean_delta_points": _f(v.mean_delta * 100),
            "ci_points": [_f(boot.bca_low * 100), _f(boot.bca_high * 100)],
            "p_value": _f(v.p_value),
            "cohens_d": _f(v.cohens_d),
        },
        "summary": {
            **{k: _f(val) for k, val in report.scores_summary.items()},
            "n_jobs": report.n_jobs,
        },
        "tests": {
            "primary": {
                "name": report.primary_test.name,
                "statistic": _f(report.primary_test.statistic),
                "pvalue": _f(report.primary_test.pvalue),
                "ci_low": _f(report.primary_test.ci_low),
                "ci_high": _f(report.primary_test.ci_high),
            },
            "normality": {
                "name": report.normality.name,
                "statistic": _f(report.normality.statistic),
                "pvalue": _f(report.normality.pvalue),
                "normal_at_05": bool(report.normality.detail.get("normal_at_05", True)),
            },
            "cuped_test": {
                "name": report.cuped_test.name,
                "pvalue": _f(report.cuped_test.pvalue),
                "ci_low": _f(report.cuped_test.ci_low),
                "ci_high": _f(report.cuped_test.ci_high),
            },
        },
        "effect": {
            "cohens_d": _f(report.cohens_d),
            "achieved_power": _f(report.achieved_power),
            "required_n_80": _f(report.required_n_80),
            "mde": report.mde.to_dict(orient="records"),
        },
        "bootstrap": {
            "point": _f(boot.point),
            "percentile": [_f(boot.pct_low), _f(boot.pct_high)],
            "bca": [_f(boot.bca_low), _f(boot.bca_high)],
            "n_resamples": boot.n_resamples,
        },
        "cuped": {
            "variance_reduction": _f(report.cuped.variance_reduction),
            "r_squared": _f(report.cuped.r_squared),
            "effective_n_multiplier": _f(report.cuped.effective_n_multiplier),
            "n_covariates": report.cuped.n_covariates,
        },
        "sequential": {
            "always_valid_p": _f(report.sequential.always_valid_p),
            "reject_h0": bool(report.sequential.reject_h0),
            "n": report.sequential.n,
            "trajectory": sequential_points,
        },
        "bayes": {
            "k": report.bayes.k,
            "n": report.bayes.n,
            "posterior_mean": _f(report.bayes.mean),
            "credible_interval": [_f(report.bayes.ci_low), _f(report.bayes.ci_high)],
            "prob_b_beats_a": _f(report.bayes.prob_b_beats_a),
            "posterior_curve": [
                {"p": float(x), "density": float(y)} for x, y in zip(xs, pdf, strict=True)
            ],
        },
        "distributions": {
            "bin_centers": [float(c) for c in centers],
            "resume_a": [int(c) for c in a_counts],
            "resume_b": [int(c) for c in b_counts],
        },
        "clusters": clusters,
    }

    if resume_a is not None and resume_b is not None:
        out["inputs"] = {
            slot: {
                "chars": r.char_count,
                "format": r.source_format,
                "parser": r.parser_used,
                "skills": r.skills,
                "parse_quality": r.parse_quality,
                "flags": r.quality_flags,
            }
            for slot, r in (("resume_a", resume_a), ("resume_b", resume_b))
        }
    return out
