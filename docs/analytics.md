# ResumeMatch Lab — Product Analytics Plan (PostHog)

This document defines how ResumeMatch Lab measures product success with **PostHog**. The app is **pre-launch**, so every number below is a **target or illustrative placeholder**, not an observed result. The plan covers the event taxonomy, the funnels we will watch, the cohorts we will segment by, the North Star Metric, guardrail metrics, and the privacy stance.

The guiding principle: we sell statistical rigor, so we hold our own measurement to the same standard — and we ship **metadata only**, never resume content.

---

## Event taxonomy

Every event is fired client-side from the Streamlit frontend (`apps/frontend/app.py` + `components/`). Properties listed are sent in addition to PostHog's default session/user context.

| Event | Properties | When fired |
|-------|-----------|------------|
| `app_loaded` | — | On initial page load of the app. |
| `resume_a_uploaded` | — | When Resume A is successfully provided (upload or paste) and parsed. |
| `resume_b_uploaded` | — | When Resume B is successfully provided (upload or paste) and parsed. |
| `comparison_run` | — | When the user triggers the comparison and scoring begins. |
| `verdict_revealed` | `winner`, `p_value`, `cohens_d`, `significant` | When the analysis completes and the verdict card renders. |
| `methodology_toggled` | — | When the user expands/opens the LaTeX methodology section. |
| `per_cluster_table_sorted` | — | When the user sorts the per-cluster results table. |
| `pdf_report_downloaded` | — | When the user downloads the reportlab PDF report. |
| `result_shared` | — | When the user shares their result via the share affordance. |

**Note on `verdict_revealed` properties** — `winner` (A or B), `p_value`, and `cohens_d` are statistical outputs; `significant` is the boolean that determines whether a comparison counts toward the North Star Metric. None of these expose resume content.

---

## Funnels

### 1. Engagement funnel (core flow)

Measures how many visitors complete the full path from arrival to a revealed verdict.

```
app_loaded → resume_a_uploaded → resume_b_uploaded → comparison_run → verdict_revealed
```

The largest expected drop-off is between `app_loaded` and `resume_a_uploaded` (intent to first action). Target: a healthy share of loaders reach `verdict_revealed`; exact conversion to be established post-launch.

### 2. Depth funnel (did they engage with the rigor?)

Measures whether users who saw a verdict went on to explore *how* it was reached.

```
verdict_revealed → ( methodology_toggled  OR  per_cluster_table_sorted )
```

This funnel is the behavioral signal that the product's differentiator — visible statistical depth — is actually being consumed.

### 3. Conversion funnel (did they take the result with them?)

Measures whether a revealed verdict turned into an exported or shared artifact.

```
verdict_revealed → ( pdf_report_downloaded  OR  result_shared )
```

Downloads and shares are our proxy for perceived value and for organic distribution.

---

## Cohorts

| Cohort | Definition |
|--------|-----------|
| **Returning users (W1 / W2)** | Users seen again in week 1 and/or week 2 after their first session. |
| **Deep-engagement users** | Users who both `methodology_toggled` **and** `per_cluster_table_sorted` in a session. |
| **Sharers** | Users who fired `result_shared` (and/or `pdf_report_downloaded`) — the cohort most likely to drive referrals. |

These cohorts let us compare retention and conversion across casual vs. deeply engaged vs. distributing users.

---

## North Star Metric

> **Decisive Comparisons per Week** = the number of unique sessions in a week containing a `verdict_revealed` event where `significant = true`.

This metric captures the moment the product delivers its core value: a user got a **statistically decisive answer** about which resume is better. It rewards real usage (a comparison was run to completion) *and* a meaningful outcome (the result cleared the significance bar), rather than vanity counts like page loads. Target trajectory to be set after launch establishes a baseline.

---

## Guardrail metrics

We watch these to ensure growth in the North Star does not come at the cost of a degraded experience:

| Guardrail | Definition | Why it matters |
|-----------|-----------|----------------|
| **Comparison completion rate** | `verdict_revealed` ÷ `comparison_run` | A drop signals scoring failures, timeouts, or UI breakage in the core flow. |
| **Parse-quality warning rate** | Share of uploads that raise a parser quality flag | A rise signals degraded input handling (bad PDFs, scanned files) that undermines verdict trustworthiness. |

---

## Privacy stance

- **Metadata only.** Events carry statistical and interaction metadata (e.g. `winner`, `p_value`, `cohens_d`, `significant`) — **never the resume text, file contents, or extracted skills**.
- Resume text is processed in-app for parsing, embedding, and scoring, and is **not** transmitted to PostHog or any third party.
- This stance is non-negotiable: the product asks users to upload personal career documents, so analytics must remain content-blind by design.
