"""Gap-surfacing: word-boundary matching, per-losing-cluster, noise floor."""

from __future__ import annotations

import pandas as pd

from core.gaps import _skills_in, cluster_gaps


def test_word_boundary_no_substring_false_positive():
    # "scalable" must NOT match the skill "scala"; "kubernetes" must match.
    s = _skills_in("We run scalable kubernetes clusters with terraform.")
    assert "kubernetes" in s
    assert "terraform" in s
    assert "scala" not in s


def test_gaps_target_the_losing_resume():
    class _C:
        import numpy as _np

        cluster_ids = _np.array([0, 0, 1, 1])
        jobs = pd.DataFrame(
            {
                "title": ["devops", "sre", "data analyst", "bi"],
                "description": [
                    "kubernetes terraform ansible",
                    "kubernetes prometheus",
                    "sql tableau",
                    "sql power bi",
                ],
            }
        )

    pc = pd.DataFrame(
        {"cluster_id": [0, 1], "winner": ["B", "A"]}  # A loses c0, B loses c1
    )
    # A has no devops; B has sql
    gaps = cluster_gaps(_C(), pc, resume_a_text="python pandas", resume_b_text="sql tableau")
    c0 = {g["skill"] for g in gaps[0]}
    assert "kubernetes" in c0  # A lost devops cluster -> devops skills surface
    # B lost c1 but already has sql/tableau -> those are filtered out
    c1 = {g["skill"] for g in gaps[1]}
    assert "sql" not in c1 and "tableau" not in c1


def test_tie_yields_no_gaps():
    class _C:
        import numpy as _np

        cluster_ids = _np.array([0])
        jobs = pd.DataFrame({"title": ["x"], "description": ["kubernetes"]})

    pc = pd.DataFrame({"cluster_id": [0], "winner": ["tie"]})
    gaps = cluster_gaps(_C(), pc, "a", "b")
    assert gaps[0] == []
