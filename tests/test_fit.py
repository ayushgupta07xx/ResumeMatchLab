"""Single-résumé fit: shape + honesty (relative percentile, per-cluster means)."""

from __future__ import annotations

import pytest

from core.data import JOBS_PARQUET, load_corpus
from core.fit import fit_resume

pytestmark = pytest.mark.skipif(not JOBS_PARQUET.exists(), reason="job snapshot not built")


def test_fit_shape_and_ranges():
    c = load_corpus()
    out = fit_resume("devops engineer kubernetes terraform aws ci/cd prometheus", c)
    assert out["mode"] == "single_fit"
    assert out["overall"]["n_jobs"] == c.n_jobs
    assert len(out["clusters"]) == c.n_clusters
    for cl in out["clusters"]:
        assert -1.01 <= cl["mean_score"] <= 1.01
        assert 0.0 <= cl["percentile"] <= 100.0
    # top/weak are disjoint label lists drawn from the clusters
    labels = {cl["label"] for cl in out["clusters"]}
    assert set(out["top_clusters"]).issubset(labels)
    assert set(out["weak_clusters"]).issubset(labels)


def test_devops_resume_leans_infra_over_analytics():
    c = load_corpus()
    out = fit_resume(
        "Site reliability engineer. Kubernetes, Terraform, ArgoCD, Prometheus, "
        "AWS EKS, Helm, CI/CD, incident response, SLOs.",
        c,
    )
    by = {cl["label"]: cl["mean_score"] for cl in out["clusters"]}
    devops = next((v for k, v in by.items() if "DevOps" in k), None)
    ml = next((v for k, v in by.items() if "Machine Learning" in k), None)
    if devops is not None and ml is not None:
        assert devops > ml  # infra résumé scores its own segment higher
