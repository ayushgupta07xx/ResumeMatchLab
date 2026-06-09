from __future__ import annotations

import numpy as np
import pytest

from core.data import JOBS_PARQUET, load_corpus
from core.scoring import compare_resumes, score_against_jobs
from stats.engine import analyze
from tests.conftest import fake_embedder

pytestmark = pytest.mark.skipif(not JOBS_PARQUET.exists(), reason="job snapshot not built")


def test_corpus_loads():
    c = load_corpus()
    assert c.n_jobs == 9014
    assert c.matrix.shape == (9014, 384)
    norms = np.linalg.norm(c.matrix, axis=1)
    assert np.allclose(norms, 1.0, atol=1e-4)
    assert c.n_clusters == 8


def test_score_against_jobs_range():
    c = load_corpus()
    s = score_against_jobs(fake_embedder()("devops engineer"), c.matrix)
    assert s.shape == (9014,)
    assert s.min() >= -1.01 and s.max() <= 1.01


def test_identical_resumes_zero_delta():
    c = load_corpus()
    scoring = compare_resumes("same text", "same text", c, embed=fake_embedder())
    assert np.allclose(scoring.deltas, 0.0)


def test_end_to_end_analyze():
    c = load_corpus()
    scoring = compare_resumes(
        "resume A devops kubernetes terraform aws",
        "resume B data scientist python pytorch nlp",
        c,
        embed=fake_embedder(),
    )
    rep = analyze(scoring, c)
    assert rep.n_jobs == 9014
    assert rep.verdict.winner in {"A", "B", "tie"}
    assert len(rep.per_cluster) == 8
    assert 0.0 <= rep.cuped.variance_reduction <= 1.0
    assert 0.0 <= rep.bayes.prob_b_beats_a <= 1.0
    assert rep.mde.shape[0] == 3
    assert {"mean_a", "mean_b", "mean_delta"}.issubset(rep.scores_summary)
    assert isinstance(rep.verdict.headline, str) and rep.verdict.headline
