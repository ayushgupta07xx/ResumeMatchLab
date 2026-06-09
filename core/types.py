"""Shared dataclasses for parsing, scoring, and statistical results.

Kept dependency-light (numpy only) so the statistical engine and its tests can
import them without pulling in torch/streamlit.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

# A resume shorter than this (after parsing) is refused — see §11 guardrails.
MIN_SCORABLE_CHARS = 200


@dataclass
class ResumeText:
    """Parsed resume plus quality signals surfaced to the user."""

    text: str
    char_count: int
    source_format: str  # "pdf" | "docx" | "txt" | "text"
    parse_quality: float  # 0..1 heuristic (alpha ratio x length adequacy)
    parser_used: str = ""  # e.g. "pdfplumber", "pymupdf-fallback"
    quality_flags: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)

    @property
    def is_scorable(self) -> bool:
        return self.char_count >= MIN_SCORABLE_CHARS


@dataclass
class ScoringResult:
    """Per-job cosine scores for both resumes against the corpus (paired)."""

    job_ids: np.ndarray
    cluster_ids: np.ndarray
    cluster_labels: np.ndarray
    scores_a: np.ndarray
    scores_b: np.ndarray

    @property
    def deltas(self) -> np.ndarray:
        """score_B - score_A, one paired observation per job."""
        return self.scores_b - self.scores_a

    @property
    def n_jobs(self) -> int:
        return int(len(self.job_ids))


@dataclass
class TestResult:
    """A single inferential test's output, rendered uniformly in the UI."""

    name: str
    statistic: float
    pvalue: float
    ci_low: float | None = None
    ci_high: float | None = None
    effect_size: float | None = None
    df: float | None = None
    detail: dict = field(default_factory=dict)

    @property
    def significant(self) -> bool:
        return self.pvalue < 0.05


@dataclass
class GuardrailFlag:
    """A surfaced warning that does not block scoring but cautions the user."""

    code: str
    message: str
    severity: str = "warning"  # "warning" | "block"
