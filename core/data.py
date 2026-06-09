"""Load the static job snapshot and its pre-computed embeddings.

The corpus ships in the repo as Parquet (built by ``scripts/export_from_jobatlas.py``
from JobAtlas's Postgres), so the app runs fully offline and reproducibly.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parents[1]
JOBS_PARQUET = REPO / "data" / "jobs_snapshot" / "jobs.parquet"
EMB_PARQUET = REPO / "embeddings" / "jobs_cache.parquet"
CLUSTERS_PARQUET = REPO / "data" / "jobs_snapshot" / "cluster_labels.parquet"

EMBED_DIM = 384
MODEL_NAME = "BAAI/bge-small-en-v1.5"


@dataclass(frozen=True)
class JobCorpus:
    """The job universe: metadata + an aligned, normalized embedding matrix."""

    jobs: pd.DataFrame  # one row per job, aligned row-for-row with ``matrix``
    matrix: np.ndarray  # (N, 384) float32, L2-normalized
    job_ids: np.ndarray  # (N,) int64
    cluster_ids: np.ndarray  # (N,) int16
    cluster_labels: np.ndarray  # (N,) str
    cluster_names: dict[int, str]  # cluster_id -> human label

    @property
    def n_jobs(self) -> int:
        return int(self.matrix.shape[0])

    @property
    def n_clusters(self) -> int:
        return len(self.cluster_names)


@lru_cache(maxsize=1)
def load_corpus() -> JobCorpus:
    """Load and cache the corpus. Embeddings are reindexed to the jobs order by
    ``job_id`` so row i of ``matrix`` always matches row i of ``jobs``."""
    if not JOBS_PARQUET.exists():
        raise FileNotFoundError(
            f"{JOBS_PARQUET} missing — run scripts/export_from_jobatlas.py first."
        )
    jobs = pd.read_parquet(JOBS_PARQUET).reset_index(drop=True)

    emb = pd.read_parquet(EMB_PARQUET).set_index("job_id")
    emb = emb.reindex(jobs["job_id"])  # align to jobs order
    dim_cols = [f"d{i}" for i in range(EMBED_DIM)]
    matrix = emb[dim_cols].to_numpy(dtype=np.float32)

    # Defensive renormalization (the source vectors are already L2-normalized).
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    matrix = matrix / norms

    cluster_ids = jobs["cluster_id"].to_numpy()
    cluster_labels = jobs["cluster_label"].astype(str).to_numpy()
    cluster_names = {
        int(cid): str(name)
        for cid, name in jobs.drop_duplicates("cluster_id")
        .set_index("cluster_id")["cluster_label"]
        .items()
    }

    return JobCorpus(
        jobs=jobs,
        matrix=matrix,
        job_ids=jobs["job_id"].to_numpy(),
        cluster_ids=cluster_ids,
        cluster_labels=cluster_labels,
        cluster_names=dict(sorted(cluster_names.items())),
    )


def load_cluster_summary() -> pd.DataFrame:
    """Cluster id/label/size table for display."""
    return pd.read_parquet(CLUSTERS_PARQUET)
