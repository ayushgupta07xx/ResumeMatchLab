from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from apps.api.serialize import report_to_dict
from core.data import JOBS_PARQUET, load_corpus
from core.scoring import compare_resumes
from stats.engine import analyze
from tests.conftest import fake_embedder

pytestmark = pytest.mark.skipif(not JOBS_PARQUET.exists(), reason="job snapshot not built")

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["n_jobs"] == 9014
    assert body["n_clusters"] == 8
    assert body["model"].startswith("BAAI/")


def test_serializer_contract():
    # Build a real report with the deterministic fake embedder (no model needed),
    # then assert the JSON contract the frontend depends on.
    corpus = load_corpus()
    scoring = compare_resumes(
        "devops aws kubernetes terraform " * 8,
        "data scientist python pytorch nlp " * 8,
        corpus,
        embed=fake_embedder(),
    )
    payload = report_to_dict(analyze(scoring, corpus), scoring)

    for key in (
        "verdict",
        "summary",
        "tests",
        "effect",
        "bootstrap",
        "cuped",
        "sequential",
        "bayes",
        "distributions",
        "clusters",
    ):
        assert key in payload

    assert payload["verdict"]["winner"] in {"A", "B", "tie"}
    assert len(payload["clusters"]) == 8
    assert len(payload["bayes"]["posterior_curve"]) == 128
    assert len(payload["distributions"]["bin_centers"]) == 40
    assert payload["summary"]["n_jobs"] == 9014


def test_compare_text_rejects_short_input():
    r = client.post("/compare/text", json={"resume_a": "too short", "resume_b": "also short"})
    assert r.status_code == 422
