"""Single-résumé market-fit: score one résumé against the whole job corpus and
summarize per cluster. No A/B, no paired stats (bootstrap/CUPED/Bayes are
comparison tools). Match score = textual similarity, NOT hireability; results are
framed as *relative* percentiles against the corpus's own score spread, never an
absolute 'you are an X% match'.

Per cluster we also surface:
  - role_fit (0-100): how closely this résumé resembles the cluster's REAL jobs.
    Reference = each corpus job's mean cosine resemblance to the cluster
    (job · cluster_centroid). The cluster's own postings sit at the high end,
    unrelated postings at the low end; the résumé's mean-to-cluster is ranked
    within that. 100 => resembles this role more than nearly every real posting.
    Traceable to real jobs; never "hireability".
  - matched_skills / missing_skills: skills common in the cluster's postings the
    résumé does / does not contain (reuses core.gaps vocabulary + frequencies).
    Missing excludes discipline labels (EXCLUDE_FROM_GAPS) so it never reads
    "you're missing data engineering".
  - coverage: honest résumé diagnostics shown BESIDE role_fit, never folded in.
"""

from __future__ import annotations

import re
from functools import lru_cache

import numpy as np

import core.gaps as _gaps
from core.gaps import (
    EXCLUDE_FROM_GAPS,
    MIN_FREQ,
    TOP_N,
    _cluster_skill_freq,
    _skills_in,
)
from core.scoring import embed_chunks, score_against_jobs

# --- résumé-text diagnostics (coverage) -------------------------------------

_METRIC = re.compile(
    r"%|\$|₹"
    r"|\d+(?:\.\d+)?\s?[kKmMbB×xX]\b"  # scaled: 12k, 3.5M, 10x
    r"|\d{1,3}(?:,\d{3})+"  # comma-grouped: 12,000
    r"|\d{3,}"  # raw 3+ digit: 5000
)


def count_quantified(text: str) -> int:
    """Count individual quantified-impact metrics — a percent/currency, a scaled
    number (12k, 3.5M, 10x), a comma-grouped number (12,000), or a raw 3+-digit
    number — skipping bare 4-digit years. Counts metrics, not lines, so a dense
    bullet with two numbers counts both. Conservative: ignores 1-2 digit figures
    (GPAs, small counts) to avoid noise."""
    n = 0
    for m in _METRIC.finditer(text):
        tok = m.group()
        if tok.isdigit() and len(tok) == 4 and 1900 <= int(tok) <= 2099:
            continue  # bare year, not an impact metric
        n += 1
    return n


_SECTION_PATS: dict[str, re.Pattern] = {
    "experience": re.compile(
        r"\b(experience|employment|work history|professional background)\b", re.I
    ),
    "education": re.compile(r"\b(education|academics?|qualifications?)\b", re.I),
    "skills": re.compile(r"\b(skills|technical skills|technologies|competenc)\b", re.I),
    "projects": re.compile(r"\b(projects?|portfolio)\b", re.I),
}


def detect_sections(text: str) -> dict[str, bool]:
    """Header-keyword scan over raw text. Detection, not judgement: True is a
    positive signal; False means 'not detected' (formatting may hide it), never a
    penalty. Never feeds role_fit."""
    return {name: bool(pat.search(text)) for name, pat in _SECTION_PATS.items()}


# --- within-cluster reference distribution (Role Fit Score) -----------------

_CORPUS_REF: dict[int, object] = {}


@lru_cache(maxsize=16)
def _cluster_ref(cluster_id: int, corpus_key: int) -> tuple[float, ...]:
    """Reference distribution for role_fit: each corpus job's mean cosine
    resemblance to this cluster (job · cluster_centroid). Cached per (cluster,
    corpus); O(N·D), computed once. Cluster jobs land high, unrelated jobs low."""
    corpus = _CORPUS_REF[corpus_key]
    mask = corpus.cluster_ids == cluster_id
    if not mask.any():
        return ()
    centroid = corpus.matrix[mask].mean(axis=0)  # (D,) un-normalized cluster mean
    ref = corpus.matrix @ centroid  # (N,) each job's mean resemblance to cluster
    return tuple(float(x) for x in ref)


def _role_fit(resume_mean_to_cluster: float, cluster_id: int, corpus) -> float:
    """Percentile (0-100) of the résumé's mean similarity-to-cluster within the
    cluster-resemblance distribution of all real jobs. No reference => 50.0."""
    _CORPUS_REF[id(corpus)] = corpus
    ref = _cluster_ref(cluster_id, id(corpus))
    if not ref:
        return 50.0
    arr = np.asarray(ref)
    return round(float((arr < resume_mean_to_cluster).mean() * 100.0), 1)


# --- main -------------------------------------------------------------------


def fit_resume(resume_text: str, corpus) -> dict:
    scores = score_against_jobs(embed_chunks(resume_text), corpus.matrix)  # (N,)
    cids = corpus.cluster_ids
    names = corpus.cluster_names
    # register corpus so core.gaps._cluster_skill_freq can resolve it by id
    # (the A/B path sets this inside cluster_gaps; single-fit calls freq directly).
    _gaps._CORPUS_REF[id(corpus)] = corpus
    have = _skills_in(resume_text)
    quantified = count_quantified(resume_text)
    sections = detect_sections(resume_text)

    overall_mean = float(scores.mean())
    per_cluster = []
    for cid in sorted(names):
        mask = cids == cid
        n = int(mask.sum())
        if n == 0:
            continue
        cs = scores[mask]
        mean_c = float(cs.mean())
        # corpus-wide percentile — leans-toward this segment vs the whole market
        # (used by the overview bars).
        pct = float((scores < mean_c).mean() * 100.0)
        # within-role Role Fit Score — resembles this cluster's REAL jobs?
        role_fit = _role_fit(mean_c, int(cid), corpus)
        # matched / missing skills from the cluster's own postings
        freq = _cluster_skill_freq(int(cid), id(corpus))
        matched = [
            {"skill": name, "freq": round(f, 3)}
            for name, f in freq
            if f >= MIN_FREQ and name in have
        ][:TOP_N]
        missing = [
            {"skill": name, "freq": round(f, 3)}
            for name, f in freq
            if f >= MIN_FREQ and name not in have and name not in EXCLUDE_FROM_GAPS
        ][:TOP_N]
        n_matched, n_missing = len(matched), len(missing)
        denom = n_matched + n_missing
        skills_ratio = round(n_matched / denom, 3) if denom else None
        per_cluster.append(
            {
                "cluster_id": int(cid),
                "label": str(names[cid]),
                "n": n,
                "mean_score": round(mean_c, 4),
                "percentile": round(pct, 1),
                "role_fit": role_fit,
                "matched_skills": matched,
                "missing_skills": missing,
                "coverage": {
                    "skills_ratio": skills_ratio,
                    "quantified": quantified,
                    "sections": sections,
                },
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
