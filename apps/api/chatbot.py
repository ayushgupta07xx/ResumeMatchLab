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
DEFAULT_MODEL = "openai/gpt-oss-120b"
MAX_USER_CHARS = 1500
MAX_TURNS = 12
TIMEOUT_S = 30

SYSTEM_PROMPT = """You are the product guide for ResumeMatch Lab, a statistical
tool for resumes, built by Ayush Gupta (GitHub: ayushgupta07xx).
You work on every page, so a visitor can understand the product WITHOUT running
anything first — explain concepts and the product generally when no result is present.

The tool has TWO modes, both scoring against 9,014 real Indian tech job postings:
1. COMPARE (A/B): the user uploads two versions of one resume; the tool runs a full
   statistical pipeline to say which version matches the market better, by how much,
   and in which job segments. This is the primary mode and most metrics below describe it.
2. SINGLE FIT: the user scores ONE resume against the market. Instead of an A/B verdict,
   it returns a per-cluster "Role Fit" — a 0-100 percentile of how well the resume
   matches each of the 9 job clusters (ranked against every corpus job's match to that
   cluster), plus matched skills, missing skills, and section coverage. Use this to help
   a user see which roles they lean toward and what to add. When a single-fit result is
   present, ground your answer in its role_fit percentiles and matched/missing skills.

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
  length) to strip out variance unrelated to the resumes, tightening the estimate. A
  reported "40% variance reduction, x1.67 effective N" means the CI is as tight as a
  ~67% bigger sample would give. It never changes which resume wins — only the precision.
  (Use the actual figures from THIS comparison, shown in the results.)
- mSPRT (always-valid p): a sequential test whose p-value stays valid even if you peek
  as jobs stream in — no inflated false positives from optional stopping.
- Bayesian Beta-Binomial posterior: treats each job as a win/loss for B and gives the
  probability that B beats A on a given job, with a credible interval. A posterior
  mean near 0.29 would mean B out-scores A on roughly 29% of jobs. (Use the actual
  figure from THIS comparison, shown in the results.)
- Per-cluster breakdown with BH-FDR: the same test run inside each of the 9 job
  clusters, with a Benjamini-Hochberg correction so testing 9 clusters at once doesn't
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
- The 9 clusters are K-means groups of the job corpus, labeled by their dominant titles.
  Most are crisp (Data & Analytics, Data Engineering, Machine Learning / AI, DevOps / SRE / Cloud,
  Frontend / Backend / Full-stack, Product / Project Management, Software Engineering / QA); the
  two boilerplate-dominated residual clusters have no crisp segment and are named "Mixed —
  Enterprise/Generalist" and "Mixed — IT Services/Ops" rather than forced into a specialty the
  jobs don't support. A cluster is a rough segment of the market, not a recruiter's verdict.

YOUR RULES
- Base every number on the RESULT CONTEXT you are given. Restate and explain those
  figures; never invent or estimate a number, CI, or p-value that isn't there. This
  includes PROJECTED or ILLUSTRATIVE numbers: do not claim a skill appears in "~80% of
  resumes", that a change "lifts the score to ~0.7", or any cohort/percentage/
  before-after figure not present in the context. Give improvement advice
  QUALITATIVELY (which skills to add, which sections to strengthen) and attach a number
  only when it is one the context actually provides.
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


def _fit_context(result: dict) -> str:
    """Grounding block for a single-résumé fit (no A/B verdict): per-cluster
    role_fit percentile, matched/missing skills, and coverage."""
    ov = result.get("overall", {})
    rows = sorted(
        result.get("clusters", []),
        key=lambda c: c.get("role_fit", 0),
        reverse=True,
    )
    lines = [
        "FIT CONTEXT (single résumé scored against the job market — cite these):",
        f"- overall: mean_score={ov.get('mean_score')}, best_score={ov.get('best_score')}, "
        f"n_jobs={ov.get('n_jobs')}",
        "- role_fit is a within-role percentile (0-100): the résumé's match to that "
        "cluster ranked against every corpus job's match to it. NOT a hireability score.",
        "- per-cluster (strongest first):",
    ]
    for c in rows:
        matched = ", ".join(sk["skill"] for sk in (c.get("matched_skills") or [])[:6])
        missing = ", ".join(sk["skill"] for sk in (c.get("missing_skills") or [])[:6])
        cov = c.get("coverage", {})
        secs = cov.get("sections", {})
        present = ", ".join(k for k, v in secs.items() if v) or "none"
        lines.append(
            f"  {c.get('label')}: role_fit={c.get('role_fit')}, "
            f"skills_ratio={cov.get('skills_ratio')}, quantified={cov.get('quantified')}, "
            f"sections=[{present}]"
        )
        lines.append(f"      matched: {matched or 'none'}; missing: {missing or 'none'}")
    return "\n".join(lines)


def _mde_summary(mde: list | None) -> str:
    """One-line MDE grid: each power row with its alpha=0.05 floor (the
    conventional operating point), plus the strictest/loosest corners."""
    if not mde:
        return "not available"
    parts = []
    for row in mde:
        power = row.get("power")
        a05 = row.get("alpha=0.05")
        if power is not None and a05 is not None:
            parts.append(f"{int(power * 100)}% power -> d>={a05}")
    return "; ".join(parts) if parts else "not available"


def _result_context(result: dict | None) -> str:
    """Compact the result JSON into a grounding block the model can cite."""
    if not result:
        return "No comparison has been run yet; explain concepts generally."
    if result.get("mode") == "single_fit":
        return _fit_context(result)
    v = result.get("verdict", {})
    cu = result.get("cuped", {})
    ba = result.get("bayes", {})
    eff = result.get("effect", {})
    clusters = []
    for c in result.get("clusters", []):
        diff = c.get("differentiators") or {}
        af = ", ".join(s["skill"] for s in diff.get("a_favoring", [])[:4])
        bf = ", ".join(s["skill"] for s in diff.get("b_favoring", [])[:4])
        line = (
            f"{c.get('label')}: delta={c.get('mean_delta')}, winner={c.get('winner')}, "
            f"p_bh={c.get('p_bh_fdr')}"
        )
        if af or bf:
            line += f"  [A-favoring skills: {af or 'none'}; B-favoring: {bf or 'none'}]"
        clusters.append(line)
    lines = [
        "RESULT CONTEXT (the comparison currently on screen — cite these):",
        f"- verdict: {v.get('headline')}",
        f"- mean_delta_points: {v.get('mean_delta_points')}, ci_points: {v.get('ci_points')}, "
        f"p={v.get('p_value')}, cohens_d={v.get('cohens_d')}, confidence={v.get('confidence')}",
        f"- effect: achieved_power={eff.get('achieved_power')}, required_n_80={eff.get('required_n_80')}",
        "- mde (minimum detectable effect, Cohen's d; rows=power, cols=alpha): "
        + _mde_summary(eff.get("mde")),
        f"- cuped: variance_reduction={cu.get('variance_reduction')}, "
        f"effective_n_multiplier={cu.get('effective_n_multiplier')}",
        f"- bayes: P(B>A)={ba.get('prob_b_beats_a')}, credible_interval={ba.get('credible_interval')}",
        f"- cluster win-counts (authoritative — use these, do not recount): "
        f"A wins {sum(1 for c in result.get('clusters', []) if c.get('winner') == 'A')}, "
        f"B wins {sum(1 for c in result.get('clusters', []) if c.get('winner') == 'B')}, "
        f"tie {sum(1 for c in result.get('clusters', []) if c.get('winner') == 'tie')} "
        f"of {len(result.get('clusters', []))}",
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
    "/compare": "the upload page — the user adds two resume versions (A and B) to compare, or switches to single-resume mode to score one resume against the market.",
    "/fit": "the single-resume fit page, where the user scores one resume against the job market.",
    "/how-it-works": "the methodology page explaining the statistical pipeline stage by stage.",
    "/results": "the A/B results page — this comparison's verdict, metric cards, charts, and per-cluster breakdown.",
    "/fit/results": "the single-resume fit results — per-cluster Role Fit percentiles, matched and missing skills, and section coverage.",
    "/about": "the About page describing the product and its maker.",
}


def _page_line(page: str | None) -> str:
    if not page:
        return ""
    desc = _PAGE_MAP.get(page.rstrip("/") or "/") or _PAGE_MAP.get(page)
    return f"The user is currently viewing {desc}" if desc else f"The user is on {page}."


def _length_directive(mode: str) -> str:
    """Answer-length steer. Soft targets — the model won't hit exact counts,
    but brief stays tight and bulleted, detailed goes fuller."""
    if mode == "detailed":
        return (
            "ANSWER LENGTH — DETAILED MODE: give a thorough, well-structured answer of "
            "roughly 220-320 words. Open with a one-sentence direct answer, then expand "
            "with context, the 'why', and a concrete example or edge case where useful. "
            "Use short paragraphs or bullets. Do not pad, but do be genuinely complete."
        )
    return (
        "ANSWER LENGTH — BRIEF MODE: answer in AT MOST 4 short bullet points (or 3 short "
        "sentences), UNDER 90 words total. No opening sentence, no preamble, no restating "
        "the question, no closing summary. Lead straight with the answer. If the topic is "
        "large, give only the single most important point and stop."
    )


def groq_chat(
    messages: list[dict],
    result: dict | None = None,
    page: str | None = None,
    mode: str = "brief",
) -> str:
    """Grounded chat: system prompt + result context + user turns. No tools."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise GroqError("unconfigured")
    model = os.environ.get("GROQ_MODEL", DEFAULT_MODEL)
    convo = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": _page_line(page)
            + "\n"
            + _result_context(result)
            + "\n"
            + _length_directive(mode),
        },
        *messages,
    ]
    msg = _call(api_key, model, convo)
    return (msg.get("content") or "").strip()
