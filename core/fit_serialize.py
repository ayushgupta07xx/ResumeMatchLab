"""Serialize a single-résumé fit result for the frontend. Distinct from the A/B
report_to_dict — no verdict/delta, just per-cluster match strength framed as a
relative percentile against the corpus's own score spread."""

from __future__ import annotations


def fit_to_dict(fit: dict) -> dict:
    # fit already JSON-safe from core.fit.fit_resume; pass through with a stable
    # shape the UI reads (mirrors the A/B `clusters` key so the forest/table
    # components can render a single-series variant).
    return {
        "mode": "single_fit",
        "overall": fit["overall"],
        "clusters": fit["clusters"],
        "top_clusters": fit["top_clusters"],
        "weak_clusters": fit["weak_clusters"],
    }
