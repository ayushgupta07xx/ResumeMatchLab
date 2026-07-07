"""Single-résumé market-fit: score one résumé against the whole job corpus and
summarize per cluster. No A/B, no paired stats (bootstrap/CUPED/Bayes are
comparison tools). Match score = textual similarity, NOT hireability; results are
framed as *relative* percentiles against the corpus's own score spread, never an
absolute 'you are an X% match'.
"""

from __future__ import annotations

from core.scoring import embed_chunks, score_against_jobs


def fit_resume(resume_text: str, corpus) -> dict:
    scores = score_against_jobs(embed_chunks(resume_text), corpus.matrix)  # (N,)
    cids = corpus.cluster_ids
    names = corpus.cluster_names

    # overall: where this résumé's mean score sits within the per-job score spread
    overall_mean = float(scores.mean())

    per_cluster = []
    for cid in sorted(names):
        mask = cids == cid
        n = int(mask.sum())
        if n == 0:
            continue
        cs = scores[mask]
        mean_c = float(cs.mean())
        # percentile of THIS cluster's mean against ALL job scores — how strongly the
        # résumé leans toward this segment relative to the whole market.
        pct = float((scores < mean_c).mean() * 100.0)
        per_cluster.append(
            {
                "cluster_id": int(cid),
                "label": str(names[cid]),
                "n": n,
                "mean_score": round(mean_c, 4),
                "percentile": round(pct, 1),
            }
        )

    ranked = sorted(per_cluster, key=lambda d: d["mean_score"], reverse=True)
    return {
        "mode": "single_fit",
        "overall": {
            "mean_score": round(overall_mean, 4),
            "n_jobs": int(scores.shape[0]),
            "best_score": round(float(scores.max()), 4),
        },
        "clusters": per_cluster,
        "top_clusters": [c["label"] for c in ranked[:3]],
        "weak_clusters": [c["label"] for c in ranked[-3:][::-1]],
    }
