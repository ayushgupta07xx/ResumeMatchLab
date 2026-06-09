"""ResumeMatch Lab — Streamlit app.

Upload two resume variants, score both against the full Indian tech job corpus, and run a
full A/B test (frequentist + Bayesian + CUPED + mSPRT + per-cluster correction).
"""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import streamlit as st  # noqa: E402

from apps.frontend.components import analytics, charts  # noqa: E402
from apps.frontend.components.report import build_pdf_report  # noqa: E402
from core.data import load_corpus  # noqa: E402
from core.scoring import compare_resumes  # noqa: E402
from core.types import MIN_SCORABLE_CHARS, GuardrailFlag, ResumeText  # noqa: E402
from parsers.resume import parse_resume  # noqa: E402
from stats.engine import analyze  # noqa: E402

st.set_page_config(page_title="ResumeMatch Lab", page_icon="📄", layout="wide")

VERDICT_BG = {"B": "#dcfce7", "A": "#fee2e2", "tie": "#f3f4f6"}
VERDICT_BORDER = {"B": "#16a34a", "A": "#dc2626", "tie": "#9ca3af"}
CONF_BADGE = {"high": "🟢 high", "moderate": "🟡 moderate", "low": "⚪ low"}


@st.cache_resource(show_spinner="Loading job corpus…")
def get_corpus():
    return load_corpus()


def _session_id() -> str:
    if "sid" not in st.session_state:
        st.session_state.sid = uuid.uuid4().hex
    return st.session_state.sid


def _layout_variant() -> str:
    """Dogfooded A/B test on the results layout (feature-flag style)."""
    if "layout_variant" not in st.session_state:
        st.session_state.layout_variant = "A" if uuid.uuid4().int % 2 == 0 else "B"
    return st.session_state.layout_variant


def _read_input(upload, pasted: str, slot: str) -> ResumeText | None:
    if pasted and pasted.strip():
        return parse_resume(raw_text=pasted)
    if upload is not None:
        return parse_resume(data=upload.getvalue(), filename=upload.name)
    return None


def _guardrails(a: ResumeText, b: ResumeText) -> list[GuardrailFlag]:
    flags: list[GuardrailFlag] = []
    if a.char_count < MIN_SCORABLE_CHARS or b.char_count < MIN_SCORABLE_CHARS:
        flags.append(
            GuardrailFlag(
                "too_short",
                f"A resume parsed to under {MIN_SCORABLE_CHARS} characters — scoring is refused.",
                "block",
            )
        )
    longest = max(a.char_count, b.char_count, 1)
    if abs(a.char_count - b.char_count) / longest > 0.5:
        flags.append(
            GuardrailFlag(
                "length_disparity",
                "The two resumes differ a lot in length — this can bias scores.",
                "warning",
            )
        )
    set_a, set_b = set(a.skills), set(b.skills)
    union = set_a | set_b
    jaccard = len(set_a & set_b) / len(union) if union else 1.0
    if jaccard < 0.3:
        flags.append(
            GuardrailFlag(
                "skill_divergence",
                "The two resumes share few skills — they may be different roles, not "
                "A/B variants. Interpret the verdict accordingly.",
                "warning",
            )
        )
    for r, name in ((a, "A"), (b, "B")):
        if "low_quality_parse" in r.quality_flags:
            flags.append(
                GuardrailFlag(
                    f"low_quality_{name}",
                    f"Resume {name} parsed with low quality — check the preview below.",
                    "warning",
                )
            )
    return flags


def _input_panel() -> None:
    st.markdown("#### Upload your two resume variants")
    cols = st.columns(2)
    out = {}
    for slot, col in zip(("A", "B"), cols, strict=True):
        with col:
            st.markdown(f"**Resume {slot}**")
            up = st.file_uploader(
                f"PDF, DOCX or TXT — Resume {slot}",
                type=["pdf", "docx", "txt"],
                key=f"file_{slot}",
                label_visibility="collapsed",
            )
            with st.expander("…or paste text"):
                pasted = st.text_area(
                    f"Resume {slot} text",
                    key=f"text_{slot}",
                    height=140,
                    label_visibility="collapsed",
                )
            out[slot] = (up, pasted)
    st.session_state._inputs = out


def _render_preview(a: ResumeText, b: ResumeText) -> None:
    c1, c2 = st.columns(2)
    for r, col, name in ((a, c1, "A"), (b, c2, "B")):
        with col:
            badge = "✅" if not r.quality_flags else "⚠️"
            st.caption(
                f"{badge} Resume {name}: {r.char_count:,} chars · parsed by "
                f"{r.parser_used} · {len(r.skills)} skills detected"
            )
            with st.expander("Preview parsed text"):
                st.text(r.text[:1200] + ("…" if len(r.text) > 1200 else ""))


def _verdict_card(rep) -> None:
    v = rep.verdict
    s = rep.scores_summary
    pct_b = s["pct_jobs_b_wins"]
    if v.winner in ("A", "B"):
        loser = "B" if v.winner == "A" else "A"
        pct_win = (100 - pct_b) if v.winner == "A" else pct_b
        win_mean = s["mean_a"] if v.winner == "A" else s["mean_b"]
        lose_mean = s["mean_b"] if v.winner == "A" else s["mean_a"]
        edge = (win_mean - lose_mean) / lose_mean * 100 if lose_mean else 0.0
        lead = f"Resume {v.winner} is the stronger match"
        detail = (
            f"it out-scores {loser} on <b>{pct_win:.0f}% of {rep.n_jobs:,} jobs</b>, "
            f"with a <b>{edge:.1f}% higher</b> average match score"
        )
    else:
        lead = "It's effectively a tie"
        detail = "neither résumé scores meaningfully higher across the corpus"
    st.markdown(
        f"""
        <div style="background:{VERDICT_BG[v.winner]};
        border-left:6px solid {VERDICT_BORDER[v.winner]};
        padding:18px 22px;border-radius:10px;margin:6px 0 14px 0;">
          <div style="font-size:1.3rem;font-weight:700;color:#111827;line-height:1.4;">
            {lead} — {detail}.</div>
          <div style="margin-top:8px;color:#374151;font-size:0.9rem;">
            Confidence: <b>{CONF_BADGE.get(v.confidence, v.confidence)}</b>
            &nbsp;·&nbsp; {v.headline}
            &nbsp;·&nbsp; Cohen's d = <b>{v.cohens_d:+.3f}</b></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _methodology_panel(rep) -> None:
    st.markdown(
        f"**Primary test:** {rep.primary_test.name} "
        f"(chosen via Shapiro-Wilk normality gate, "
        f"p={rep.normality.pvalue:.3g})."
    )
    st.latex(
        r"d_i = \mathrm{score}_B(i) - \mathrm{score}_A(i), \qquad "
        r"\hat{d} = \tfrac{1}{N}\sum_i d_i"
    )
    st.markdown(
        "**Bootstrap** (10,000 resamples) gives percentile + BCa CIs. "
        "**CUPED** residualizes deltas on job-side covariates:"
    )
    st.latex(
        r"\hat{d}^{\,\mathrm{adj}}_i = d_i - X_i^\top\hat{\beta} + \bar{d}, "
        r"\qquad \text{var. reduction} = 1 - \frac{\mathrm{var}(d^{adj})}{\mathrm{var}(d)} = R^2"
    )
    st.markdown(
        "**mSPRT** (Robbins mixture) yields an always-valid p-value; "
        "**Beta-Binomial** gives the Bayesian posterior of P(B>A per job); "
        "**Bonferroni/BH-FDR** correct the 8 per-cluster tests."
    )
    m1, m2, m3 = st.columns(3)
    m1.metric("Achieved power", f"{rep.achieved_power:.3f}")
    m2.metric("Required N @80%", f"{rep.required_n_80:.0f}")
    m3.metric("CUPED var. reduction", f"{rep.cuped.variance_reduction * 100:.1f}%")
    st.caption("Minimum detectable effect (Cohen's d) by α × power:")
    st.dataframe(rep.mde, hide_index=True, use_container_width=True)


def _cluster_table(rep) -> None:
    view = rep.per_cluster[
        ["label", "n", "mean_delta", "p_raw", "p_bonferroni", "p_bh_fdr", "winner"]
    ].copy()
    view["mean_delta"] = (view["mean_delta"] * 100).round(2)
    for c in ("p_raw", "p_bonferroni", "p_bh_fdr"):
        view[c] = view[c].round(4)
    view = view.rename(
        columns={
            "label": "Cluster",
            "n": "N",
            "mean_delta": "Δ (pts)",
            "p_raw": "p (raw)",
            "p_bonferroni": "p (Bonf.)",
            "p_bh_fdr": "p (BH)",
            "winner": "Winner",
        }
    )
    st.dataframe(view, hide_index=True, use_container_width=True)


def _results(rep, scoring, sid: str) -> None:
    variant = _layout_variant()
    forest = charts.forest_plot(rep.per_cluster)

    if variant == "B":
        st.plotly_chart(forest, use_container_width=True, config={"displayModeBar": False})
        _verdict_card(rep)
    else:
        _verdict_card(rep)
        st.plotly_chart(forest, use_container_width=True, config={"displayModeBar": False})

    left, right = st.columns(2)
    with left:
        st.plotly_chart(
            charts.score_distributions(scoring.scores_a, scoring.scores_b),
            use_container_width=True,
            config={"displayModeBar": False},
        )
    with right:
        st.plotly_chart(
            charts.bayesian_posterior(rep.bayes),
            use_container_width=True,
            config={"displayModeBar": False},
        )

    st.plotly_chart(
        charts.sequential_trajectory(rep.sequential),
        use_container_width=True,
        config={"displayModeBar": False},
    )

    st.markdown("##### Per-cluster breakdown")
    _cluster_table(rep)

    with st.expander("🔬 Methodology — what just happened", expanded=(variant == "B")):
        analytics.capture(sid, analytics.EVENTS["methodology_toggled"], {"layout_variant": variant})
        _methodology_panel(rep)

    pdf = build_pdf_report(rep)
    if st.download_button(
        "⬇️ Download PDF report",
        data=pdf,
        file_name="resumematch_report.pdf",
        mime="application/pdf",
    ):
        analytics.capture(sid, analytics.EVENTS["pdf_downloaded"], {})


def _run_demo(corpus) -> None:
    """Auto-run the comparison on the bundled synthetic resumes (?demo=1)."""
    fix = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "synthetic_resumes"
    a = parse_resume(raw_text=(fix / "devops_engineer.txt").read_text())
    b = parse_resume(raw_text=(fix / "data_scientist.txt").read_text())
    scoring = compare_resumes(a, b, corpus)
    st.session_state.scoring = scoring
    st.session_state.rep = analyze(scoring, corpus)


def main() -> None:
    sid = _session_id()
    corpus = get_corpus()

    if (st.query_params.get("demo") or os.getenv("RM_DEMO")) and "rep" not in st.session_state:
        _run_demo(corpus)

    with st.sidebar:
        st.markdown("### 📄 ResumeMatch Lab")
        st.caption("A/B testing your resume against the live Indian tech job market.")
        st.markdown(f"**Corpus:** {corpus.n_jobs:,} jobs · {corpus.n_clusters} clusters")
        st.markdown("**Model:** BAAI/bge-small-en-v1.5 (384-dim)")
        st.info(
            "🔒 **Privacy:** resumes are processed in memory only and are never "
            "stored or sent anywhere. Only anonymous usage metadata is tracked."
        )
        st.caption("Methodology case study & source on GitHub.")

    st.title("A/B Test Your Resume Against the Job Market")
    st.markdown(
        "Upload **two versions** of your resume. We embed both, score them "
        f"against **{corpus.n_jobs:,} real Indian tech jobs**, and run a rigorous "
        "statistical A/B test to tell you which wins — and *where*."
    )

    if "first_load" not in st.session_state:
        st.session_state.first_load = True
        analytics.capture(sid, analytics.EVENTS["app_loaded"], {})

    _input_panel()
    if st.button("⚖️ Compare resumes", type="primary", use_container_width=True):
        inputs = st.session_state.get("_inputs", {})
        a = _read_input(*inputs.get("A", (None, "")), "A")
        b = _read_input(*inputs.get("B", (None, "")), "B")
        if a is None or b is None:
            st.warning("Please provide both Resume A and Resume B (upload or paste).")
            return

        analytics.capture(
            sid,
            analytics.EVENTS["resume_a_uploaded"],
            {"chars": a.char_count, "fmt": a.source_format},
        )
        analytics.capture(
            sid,
            analytics.EVENTS["resume_b_uploaded"],
            {"chars": b.char_count, "fmt": b.source_format},
        )
        _render_preview(a, b)

        flags = _guardrails(a, b)
        for f in flags:
            (st.error if f.severity == "block" else st.warning)(f.message)
        if any(f.severity == "block" for f in flags):
            return

        with st.spinner(f"Embedding resumes and scoring {corpus.n_jobs:,} jobs…"):
            scoring = compare_resumes(a, b, corpus)
            rep = analyze(scoring, corpus)
        st.session_state.rep = rep
        st.session_state.scoring = scoring
        analytics.capture(sid, analytics.EVENTS["comparison_run"], {"n_jobs": rep.n_jobs})
        analytics.capture(
            sid,
            analytics.EVENTS["verdict_revealed"],
            {
                "winner": rep.verdict.winner,
                "p_value": rep.verdict.p_value,
                "cohens_d": rep.cohens_d,
                "significant": rep.verdict.significant,
            },
        )

    if "rep" in st.session_state:
        _results(st.session_state.rep, st.session_state.scoring, sid)


if __name__ == "__main__":
    main()
