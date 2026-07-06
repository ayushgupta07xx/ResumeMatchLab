"""Per-cluster skill-gap surfacing.

For each cluster a resume *loses*, rank the tech skills that appear most often in
that cluster's job descriptions but are absent from the losing resume. Descriptive,
not prescriptive: it reports what the cluster's postings emphasise, never "add
these keywords." Word-boundary matching avoids substring false positives (e.g.
"scala" inside "scalable").
"""

from __future__ import annotations

import re
from functools import lru_cache

from parsers.resume import SKILLS

_SKILL_PATS: dict[str, re.Pattern] = {
    s.strip(): re.compile(rf"\b{re.escape(s.strip())}\b", re.I) for s in SKILLS
}

TOP_N = 6
MIN_FREQ = 0.05  # skip skills present in <5% of a cluster's postings (noise floor)

_CORPUS_REF: dict[int, object] = {}


def _skills_in(text: str) -> set[str]:
    return {name for name, pat in _SKILL_PATS.items() if pat.search(text)}


@lru_cache(maxsize=16)
def _cluster_skill_freq(cluster_id: int, corpus_key: int) -> tuple[tuple[str, float], ...]:
    corpus = _CORPUS_REF[corpus_key]
    jobs = corpus.jobs
    mask = corpus.cluster_ids == cluster_id
    n = int(mask.sum())
    if n == 0:
        return ()
    texts = (
        jobs.loc[mask, "title"].fillna("").astype(str)
        + " "
        + jobs.loc[mask, "description"].fillna("").astype(str)
    )
    counts: dict[str, int] = {}
    for t in texts:
        for name in _skills_in(t):
            counts[name] = counts.get(name, 0) + 1
    freqs = sorted(((k, c / n) for k, c in counts.items()), key=lambda kv: kv[1], reverse=True)
    return tuple(freqs)


def cluster_gaps(
    corpus, per_cluster, resume_a_text: str, resume_b_text: str
) -> dict[int, list[dict]]:
    """{cluster_id: [{skill, freq}, ...]} — skills common in a cluster's postings
    but missing from the resume that LOST that cluster. winner=="B" => A has the
    gap; winner=="A" => B has the gap; ties => []."""
    _CORPUS_REF[id(corpus)] = corpus
    skills_a = _skills_in(resume_a_text)
    skills_b = _skills_in(resume_b_text)
    out: dict[int, list[dict]] = {}
    for _, row in per_cluster.iterrows():
        cid = int(row["cluster_id"])
        winner = str(row["winner"])
        if winner == "B":
            have = skills_a
        elif winner == "A":
            have = skills_b
        else:
            out[cid] = []
            continue
        out[cid] = [
            {"skill": name, "freq": round(f, 3)}
            for name, f in _cluster_skill_freq(cid, id(corpus))
            if f >= MIN_FREQ and name not in have
        ][:TOP_N]
    return out
