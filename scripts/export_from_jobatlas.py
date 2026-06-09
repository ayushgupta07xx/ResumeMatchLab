"""Export ResumeMatch's static job snapshot from JobAtlas's Postgres.

Pulls all active, de-duplicated Indian tech jobs together with their
pre-computed ``BAAI/bge-small-en-v1.5`` (384-dim, L2-normalized) embeddings,
then runs K-means (k=8) to assign stable cluster labels for stratified
analysis. Reusing JobAtlas's corpus means both portfolio projects share one job
universe and identical embeddings -- a deliberate consistency story.

Run with a venv that has numpy/pandas/pyarrow/scikit-learn/sqlalchemy/psycopg::

    ./.venv/bin/python scripts/export_from_jobatlas.py

The job snapshot is committed to the repo so the app runs fully offline; this
script only needs to be re-run to refresh the snapshot.
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sqlalchemy import create_engine, text

REPO = Path(__file__).resolve().parents[1]
JOBATLAS_ENV = Path.home() / "code" / "JobAtlas" / ".env"

K = 8
SEED = 42

JOBS_OUT = REPO / "data" / "jobs_snapshot" / "jobs.parquet"
CLUSTERS_OUT = REPO / "data" / "jobs_snapshot" / "cluster_labels.parquet"
EMB_OUT = REPO / "embeddings" / "jobs_cache.parquet"

# Deterministic, well-spread sample (md5 ordering) joined to its embedding.
QUERY = text(
    """
    SELECT j.id AS job_id, j.title, j.company, j.city, j.state, j.country,
           j.salary_min, j.salary_max, j.currency, j.posted_date,
           j.description, j.skills, j.source, j.source_url,
           e.embedding::text AS embedding_txt
    FROM staging.jobs j
    JOIN staging.jobs_embeddings e ON e.job_id = j.id
    WHERE j.is_active = true AND COALESCE(j.is_duplicate, false) = false
    ORDER BY md5(j.id::text)
    """
)

STOP = {
    "engineer",
    "developer",
    "senior",
    "junior",
    "lead",
    "india",
    "remote",
    "manager",
    "analyst",
    "intern",
    "associate",
    "staff",
    "principal",
    "with",
    "work",
    "team",
    "years",
    "experience",
    "full",
    "time",
    "hybrid",
    "based",
}

# Keyword -> human cluster label, checked in priority order against pooled titles.
LABEL_RULES = [
    ("Data Engineering", ("data engineer", "etl", "pipeline", "spark", "warehouse", "big data")),
    (
        "Data & Analytics",
        ("data analyst", "analytics", "business intelligence", "tableau", "power bi"),
    ),
    (
        "Machine Learning / AI",
        ("machine learning", "ml engineer", "data scientist", "nlp", "deep learning", "ai "),
    ),
    (
        "DevOps / SRE / Cloud",
        ("devops", "sre", "site reliability", "infrastructure", "kubernetes", "platform", "cloud"),
    ),
    (
        "Backend Engineering",
        ("backend", "back end", "java ", "golang", "node", "microservice", "api "),
    ),
    (
        "Frontend / Mobile",
        ("frontend", "front end", "react", "angular", "android", "ios", "flutter"),
    ),
    (
        "Product Management",
        ("product manager", "product owner", "program manager", "product analyst"),
    ),
    ("Design / UX", ("designer", "ux", "ui/ux", "graphic", "creative")),
    ("QA / Testing", ("qa ", "quality assurance", "test engineer", "sdet", "automation test")),
    ("Security", ("security", "infosec", "penetration", "soc ")),
    ("Marketing / Sales", ("marketing", "sales", "growth", "seo")),
]


def load_db_urls() -> list[str]:
    env: dict[str, str] = {}
    for line in JOBATLAS_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    # Prefer Neon (cloud prod, always up); fall back to local DATABASE_URL.
    urls = [env[k] for k in ("NEON_URL", "DATABASE_URL") if env.get(k)]
    if not urls:
        raise SystemExit("No NEON_URL/DATABASE_URL found in JobAtlas/.env")
    return urls


def to_sqlalchemy(url: str) -> str:
    for prefix in ("postgresql+psycopg2://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def fetch_jobs() -> pd.DataFrame:
    last_err: Exception | None = None
    for raw in load_db_urls():
        try:
            engine = create_engine(to_sqlalchemy(raw), future=True)
            with engine.connect() as conn:
                df = pd.read_sql(QUERY, conn)
            engine.dispose()
            if len(df):
                host = re.sub(r"://[^@]+@", "://***@", raw).split("@")[-1].split("/")[0]
                print(f"connected -> {host}: {len(df)} jobs")
                return df
        except Exception as exc:  # noqa: BLE001 - try the next candidate URL
            last_err = exc
            print(f"  candidate failed: {type(exc).__name__}: {str(exc)[:140]}")
    raise SystemExit(f"Could not load jobs from any DB URL. Last error: {last_err}")


def parse_embeddings(series: pd.Series) -> np.ndarray:
    mat = np.vstack(
        [
            np.fromstring(s.strip().lstrip("[").rstrip("]"), sep=",", dtype=np.float32)
            for s in series
        ]
    )
    norms = np.linalg.norm(mat, axis=1)
    print(
        f"embedding matrix {mat.shape}, mean L2 norm {norms.mean():.4f} "
        f"(min {norms.min():.4f}, max {norms.max():.4f})"
    )
    return mat


def label_clusters(titles_by_cluster: dict[int, str]) -> dict[int, str]:
    out: dict[int, str] = {}
    used: set[str] = set()
    for cid, titles in titles_by_cluster.items():
        chosen: str | None = None
        for name, kws in LABEL_RULES:
            if name in used:
                continue
            if any(kw in titles for kw in kws):
                chosen = name
                break
        if chosen is None:
            toks = Counter(t for t in re.findall(r"[a-z]+", titles) if len(t) > 3 and t not in STOP)
            chosen = (toks.most_common(1)[0][0].title() + " Roles") if toks else f"Cluster {cid}"
        used.add(chosen)
        out[cid] = chosen
    return out


def main() -> None:
    df = fetch_jobs()

    emb = parse_embeddings(df.pop("embedding_txt"))

    # Coerce DB types parquet-friendly.
    for col in ("salary_min", "salary_max"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["skills"] = df["skills"].apply(lambda x: list(x) if x is not None else [])
    for col in (
        "title",
        "company",
        "city",
        "state",
        "country",
        "description",
        "source",
        "source_url",
        "currency",
    ):
        df[col] = df[col].astype("string")

    km = KMeans(n_clusters=K, random_state=SEED, n_init=10)
    cluster_id = km.fit_predict(emb)
    df["cluster_id"] = cluster_id.astype("int16")

    titles_by_cluster = {
        cid: " ".join(df.loc[df.cluster_id == cid, "title"].fillna("").str.lower())
        for cid in range(K)
    }
    names = label_clusters(titles_by_cluster)
    df["cluster_label"] = df["cluster_id"].map(names).astype("string")

    JOBS_OUT.parent.mkdir(parents=True, exist_ok=True)
    EMB_OUT.parent.mkdir(parents=True, exist_ok=True)

    df.to_parquet(JOBS_OUT, index=False)

    emb_df = pd.DataFrame(emb, columns=[f"d{i}" for i in range(emb.shape[1])])
    emb_df.insert(0, "job_id", df["job_id"].to_numpy())
    emb_df.to_parquet(EMB_OUT, index=False)

    summary = (
        df.groupby(["cluster_id", "cluster_label"], observed=True)
        .agg(size=("job_id", "size"))
        .reset_index()
        .sort_values("cluster_id")
    )
    summary.to_parquet(CLUSTERS_OUT, index=False)

    print("\n=== cluster sizes ===")
    for _, r in summary.iterrows():
        print(f"  {int(r.cluster_id)}: {r.cluster_label} ({int(r['size'])})")
    print(f"\nwrote:\n  {JOBS_OUT}\n  {EMB_OUT}\n  {CLUSTERS_OUT}")
    print(f"jobs.parquet {df.shape}; embeddings {emb_df.shape}")


if __name__ == "__main__":
    main()
