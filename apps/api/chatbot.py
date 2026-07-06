"""Grounded product-help assistant for ResumeMatch Lab.

A narrow product guide: it explains what ResumeMatch measures, what each metric
means, and how to read the charts — grounded on the CURRENT comparison's result
JSON so it can explain *these* numbers, never invent them. Unlike CreatorPulse's
assistant it needs no tools: the result the user is looking at is passed in as
context, so there is nothing to fetch.

Uses Groq's OpenAI-compatible endpoint via ``requests`` (already a core dep). The
endpoint that calls it is sync, so FastAPI runs the blocking request in a threadpool.
"""

from __future__ import annotations

import os

import requests

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
MAX_USER_CHARS = 1500
MAX_TURNS = 12
TIMEOUT_S = 30

SYSTEM_PROMPT = """You are the product guide for ResumeMatch Lab, a statistical
A/B-testing tool for resumes, built by Ayush Gupta (GitHub: ayushgupta07xx).
You work on every page, so a visitor can understand the product WITHOUT running a
comparison first — explain concepts and the product generally when no result is present. A user uploads two versions of a resume; the tool
scores each against 9,014 real Indian tech job postings and runs a full statistics
pipeline to say which version matches the market better, by how much, and where.
You explain what the tool does, what its numbers mean, and how to read its charts.
You are friendly, concise, and above all HONEST.

WHAT THE TOOL MEASURES
- Each resume is embedded (BAAI/bge-small-en-v1.5, 384-dim) and scored against every
  job by cosine similarity, using the resume's BEST-MATCHING chunk (asymmetric late
  interaction) so a specialist section isn't diluted by breadth. Higher = closer to
  that job's text. This is a proxy for TEXTUAL fit, NOT a hiring-outcome predictor.
- For each job, delta = score_B - score_A. The whole analysis is about that paired
  difference across 9,014 jobs.

WHAT EACH METRIC MEANS (explain in plain terms; use the live numbers you are given)
- Verdict "wins by X points": the mean of (score_B - score_A) across all jobs, x100
  for readability. Sign says which resume matches more jobs better on average.
- Paired t-test / Wilcoxon signed-rank (normality-gated): asks "is that average
  difference real, or noise?" A Shapiro-Wilk test picks the t-test when the deltas are
  roughly normal, else the rank-based Wilcoxon. A tiny p-value means the difference is
  very unlikely to be zero. p can underflow to 0 at this sample size.
- Bootstrap BCa 95% CI: resamples the paired deltas 10,000 times to get a
  bias-corrected-and-accelerated confidence interval. It's the headline interval
  because it makes no normality assumption. If it excludes zero, the effect is real.
- Cohen's d: the mean delta in standard-deviation units — effect SIZE, not just
  significance. ~0.2 small, ~0.5 medium, ~0.8 large. A big sample can make a trivial
  gap significant; d tells you if it's practically meaningful.
- CUPED variance reduction: uses pre-experiment job covariates (cluster, description
  length) to strip out variance unrelated to the resumes, tightening the estimate. "43%
  variance reduction, x1.78 effective N" means the CI is as tight as a ~78% bigger
  sample would give. It never changes which resume wins — only the precision.
- mSPRT (always-valid p): a sequential test whose p-value stays valid even if you peek
  as jobs stream in — no inflated false positives from optional stopping.
- Bayesian Beta-Binomial posterior: treats each job as a win/loss for B and gives the
  probability that B beats A on a given job, with a credible interval. "P(B>A)=0.28"
  means B out-scores A on about 28% of jobs.
- Per-cluster breakdown with BH-FDR: the same test run inside each of the 8 job
  clusters, with a Benjamini-Hochberg correction so testing 8 clusters at once doesn't
  inflate false positives. This can reveal a resume winning overall yet LOSING the
  clusters it targets (a Simpson's-paradox reversal).

HOW TO READ THE CHARTS
- Match-score distributions: two overlaid histograms of every job's similarity score,
  one per resume. Shifted right = higher typical match. Overlap = the resumes are close.
- Bayesian posterior curve: the probability distribution over the share of jobs B wins.
  A narrow peak = high certainty; the petrol dashes mark the 95% credible interval; the
  gray line at 0.50 is the tie point. A peak left of 0.50 means A tends to win.
- Per-cluster forest plot: each cluster's delta (B-A) with its 95% interval; bars right
  of zero favor B, left favor A; an interval crossing zero is not significant there.

THE CLUSTERS
- The 8 clusters are K-means groups of the job corpus, labeled by their dominant titles.
  Some are crisp (Data Engineering, Machine Learning / AI, DevOps / SRE / Cloud,
  Frontend / Backend / Full-stack); others are genuinely mixed and labeled "Mixed — <top terms>" (e.g. "Mixed —
  Business/Advisory") to stay distinguishable, rather than forced into a crisp name the
  jobs don't support. A cluster is a rough segment of the market, not a recruiter's verdict.

YOUR RULES
- Base every number on the RESULT CONTEXT you are given. Restate and explain those
  figures; never invent or estimate a number, CI, or p-value that isn't there.
- If asked about something the result doesn't contain, say you don't have it.
- Be honest about the ceiling: cosine similarity measures textual/vocabulary fit, not
  whether a candidate is a good hire. Say so when relevant.
- Stay on ResumeMatch topics. If asked for medical, legal, or financial advice or
  something unrelated, briefly decline and steer back.
- If asked who made it: ResumeMatch Lab is designed, built, and maintained by Ayush
  Gupta, a developer targeting data/analytics/engineering roles; GitHub ayushgupta07xx.
- It is free to use, runs in the browser, and never stores an uploaded resume.
- Job data provenance: the 9,014-job corpus comes from JobAtlas, a sibling project by
  the same developer that aggregates and de-duplicates Indian tech postings. ResumeMatch
  reuses JobAtlas's job universe and BGE embeddings for consistency. If asked where the
  jobs come from or about JobAtlas, share: https://github.com/ayushgupta07xx/JobAtlas
- Keep answers short and plain — usually a few sentences. Use the user's actual numbers."""


class GroqError(RuntimeError):
    """Raised on any upstream/config failure; carries a short reason string."""


def prepare_messages(raw: list[dict]) -> list[dict]:
    out: list[dict] = []
    for m in raw[-MAX_TURNS:]:
        role = m.get("role")
        content = (m.get("content") or "").strip()[:MAX_USER_CHARS]
        if role in ("user", "assistant") and content:
            out.append({"role": role, "content": content})
    if not out or out[-1]["role"] != "user":
        return []
    return out


def _result_context(result: dict | None) -> str:
    """Compact the result JSON into a grounding block the model can cite."""
    if not result:
        return "No comparison has been run yet; explain concepts generally."
    v = result.get("verdict", {})
    cu = result.get("cuped", {})
    ba = result.get("bayes", {})
    eff = result.get("effect", {})
    clusters = [
        f"{c.get('label')}: delta={c.get('mean_delta')}, winner={c.get('winner')}, "
        f"p_bh={c.get('p_bh_fdr')}"
        for c in result.get("clusters", [])
    ]
    lines = [
        "RESULT CONTEXT (the comparison currently on screen — cite these):",
        f"- verdict: {v.get('headline')}",
        f"- mean_delta_points: {v.get('mean_delta_points')}, ci_points: {v.get('ci_points')}, "
        f"p={v.get('p_value')}, cohens_d={v.get('cohens_d')}, confidence={v.get('confidence')}",
        f"- effect: achieved_power={eff.get('achieved_power')}, required_n_80={eff.get('required_n_80')}",
        f"- cuped: variance_reduction={cu.get('variance_reduction')}, "
        f"effective_n_multiplier={cu.get('effective_n_multiplier')}",
        f"- bayes: P(B>A)={ba.get('prob_b_beats_a')}, credible_interval={ba.get('credible_interval')}",
        "- per-cluster: " + " | ".join(clusters),
    ]
    return "\n".join(lines)


def _call(api_key: str, model: str, convo: list[dict]) -> dict:
    payload = {
        "model": model,
        "messages": convo,
        "temperature": 0.2,
        "max_tokens": 700,
    }
    try:
        r = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=TIMEOUT_S,
        )
    except requests.RequestException as e:
        raise GroqError("network") from e
    if r.status_code == 429:
        raise GroqError("rate_limited")
    if r.status_code >= 400:
        raise GroqError(f"upstream_{r.status_code}")
    try:
        return r.json()["choices"][0]["message"]
    except (KeyError, IndexError, ValueError) as e:
        raise GroqError("bad_response") from e


_PAGE_MAP = {
    "/": "the home page — product intro with an example verdict.",
    "/compare": "the upload page, where the user adds two resume versions (A and B) to compare.",
    "/how-it-works": "the methodology page explaining the statistical pipeline stage by stage.",
    "/results": "the results page — this comparison's verdict, metric cards, charts, and per-cluster breakdown.",
    "/about": "the About page describing the product and its maker.",
}


def _page_line(page: str | None) -> str:
    if not page:
        return ""
    desc = _PAGE_MAP.get(page.rstrip("/") or "/") or _PAGE_MAP.get(page)
    return f"The user is currently viewing {desc}" if desc else f"The user is on {page}."


def groq_chat(messages: list[dict], result: dict | None = None, page: str | None = None) -> str:
    """Grounded chat: system prompt + result context + user turns. No tools."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise GroqError("unconfigured")
    model = os.environ.get("GROQ_MODEL", DEFAULT_MODEL)
    convo = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": _page_line(page) + "\n" + _result_context(result)},
        *messages,
    ]
    msg = _call(api_key, model, convo)
    return (msg.get("content") or "").strip()
