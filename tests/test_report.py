from __future__ import annotations

import plotly.graph_objects as go
import pytest

from apps.frontend.components import charts
from apps.frontend.components.report import build_pdf_report
from core.data import JOBS_PARQUET, load_corpus
from core.scoring import compare_resumes
from stats.engine import analyze
from tests.conftest import fake_embedder

pytestmark = pytest.mark.skipif(
    not JOBS_PARQUET.exists(), reason="job snapshot not built"
)


def _build():
    c = load_corpus()
    sc = compare_resumes(
        "devops aws kubernetes terraform " * 6,
        "data scientist python pytorch nlp " * 6,
        c,
        embed=fake_embedder(),
    )
    return analyze(sc, c), sc, c


def test_pdf_report_is_valid_pdf():
    rep, _, _ = _build()
    pdf = build_pdf_report(rep)
    assert pdf[:4] == b"%PDF"
    assert len(pdf) > 1500


def test_all_charts_build():
    rep, sc, _ = _build()
    assert isinstance(charts.forest_plot(rep.per_cluster), go.Figure)
    assert isinstance(charts.score_distributions(sc.scores_a, sc.scores_b), go.Figure)
    assert isinstance(charts.bayesian_posterior(rep.bayes), go.Figure)
    assert isinstance(charts.sequential_trajectory(rep.sequential), go.Figure)
