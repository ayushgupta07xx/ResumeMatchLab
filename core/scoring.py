"""Embed resumes and score them against the job corpus.

Critical consistency rule: resumes must be embedded the *same way* JobAtlas
embedded the jobs — model ``BAAI/bge-small-en-v1.5``, no instruction prefix,
``normalize_embeddings=True`` — so the resume vector lives in the same space as
the corpus vectors and cosine similarity is meaningful.
"""

from __future__ import annotations

from collections.abc import Callable
from functools import lru_cache

import numpy as np

from core.data import MODEL_NAME, JobCorpus
from core.types import ResumeText, ScoringResult

Embedder = Callable[[str], np.ndarray]


@lru_cache(maxsize=1)
def _model():
    # Imported lazily so importing this module (and the stats engine/tests)
    # never requires torch unless an embedding is actually needed.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def embed_text(text: str) -> np.ndarray:
    """Embed one resume into a 384-dim L2-normalized vector."""
    vec = _model().encode(
        [text], normalize_embeddings=True, show_progress_bar=False
    )[0]
    return np.asarray(vec, dtype=np.float32)


def score_against_jobs(resume_vec: np.ndarray, jobs_matrix: np.ndarray) -> np.ndarray:
    """Cosine similarity of one resume against every job.

    Both sides are L2-normalized, so cosine similarity reduces to a dot product.
    Returns an (N,) array in roughly [-1, 1].
    """
    return jobs_matrix @ resume_vec.astype(np.float32)


def _as_text(resume: ResumeText | str) -> str:
    return resume.text if isinstance(resume, ResumeText) else str(resume)


def compare_resumes(
    resume_a: ResumeText | str,
    resume_b: ResumeText | str,
    corpus: JobCorpus,
    *,
    embed: Embedder = embed_text,
) -> ScoringResult:
    """Score resumes A and B against the corpus and return paired results.

    ``embed`` is injectable so tests can supply a deterministic synthetic
    embedder without loading the transformer model.
    """
    vec_a = embed(_as_text(resume_a))
    vec_b = embed(_as_text(resume_b))
    scores_a = score_against_jobs(vec_a, corpus.matrix)
    scores_b = score_against_jobs(vec_b, corpus.matrix)
    return ScoringResult(
        job_ids=corpus.job_ids,
        cluster_ids=corpus.cluster_ids,
        cluster_labels=corpus.cluster_labels,
        scores_a=scores_a,
        scores_b=scores_b,
    )
