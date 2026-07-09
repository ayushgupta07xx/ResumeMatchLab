"""Re-cluster the committed snapshot at k=9, cache-read only.

Loads committed embeddings + jobs, re-runs K-means, and re-derives labels via
the same content-based labeler as the canonical export. Touches NO database and
does NOT re-embed. Dry-run by default; --write rewrites cluster_id +
cluster_label into data/jobs_snapshot/jobs.parquet.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))
import export_from_jobatlas as exp  # noqa: E402

JOBS = REPO / "data" / "jobs_snapshot" / "jobs.parquet"
EMB = REPO / "embeddings" / "jobs_cache.parquet"


def main() -> None:
    write = "--write" in sys.argv
    jobs = pd.read_parquet(JOBS)
    emb_df = pd.read_parquet(EMB)
    dim_cols = [c for c in emb_df.columns if c != "job_id"]
    merged = jobs.merge(emb_df[["job_id", *dim_cols]], on="job_id", how="inner")
    if len(merged) != len(jobs):
        raise SystemExit(f"join mismatch: {len(merged)} vs {len(jobs)}")
    emb = merged[dim_cols].to_numpy(np.float32)

    km = KMeans(n_clusters=exp.K, random_state=exp.SEED, n_init=10)
    merged["cluster_id"] = km.fit_predict(emb).astype("int16")

    titles = {
        cid: merged.loc[merged.cluster_id == cid, "title"].fillna("").str.lower().tolist()
        for cid in range(exp.K)
    }
    names = exp.label_clusters(titles)
    merged["cluster_label"] = merged["cluster_id"].map(names).astype("string")

    summary = (
        merged.groupby(["cluster_id", "cluster_label"], observed=True)
        .size()
        .reset_index(name="n")
        .sort_values("n", ascending=False)
    )
    print(f"k={exp.K} seed={exp.SEED}  {len(merged)} jobs")
    print(summary.to_string(index=False))

    if not write:
        print("\nDRY-RUN. Re-run with --write to persist.")
        return

    base = jobs.drop(columns=["cluster_id", "cluster_label"], errors="ignore")
    out = base.merge(merged[["job_id", "cluster_id", "cluster_label"]], on="job_id", how="left")
    out = out[jobs.columns]
    out.to_parquet(JOBS, index=False)
    print(f"\nWROTE {JOBS}")


if __name__ == "__main__":
    main()
