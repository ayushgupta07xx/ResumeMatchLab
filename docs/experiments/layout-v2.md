# Experiment: Results-Page Layout v2 (A/B)

**Status:** pre-launch / planned · **Owner:** ResumeMatch Lab · **Surface:** results page (`apps/frontend/app.py`)
**Assignment:** per session via `_layout_variant()` · **Analysis:** PostHog native Bayesian A/B testing

---

## The meta-narrative (why this experiment exists)

ResumeMatch Lab *is* an A/B testing tool — it tells users which of two resume variants performs better, with confidence intervals, sequential testing, and effect sizes. So the most fitting way to evolve the product's own UI is to **dogfood**: run a real A/B test on the A/B-testing product itself.

This is layout-v2 — a feature-flag-style experiment on the results-page layout, assigned per session. Beyond the direct UX question, it serves as a living demonstration that the team eats its own cooking: the same discipline we ask users to apply to their resumes, we apply to our interface decisions.

---

## Hypothesis

> Leading with the **evidence** (the forest plot) rather than the **conclusion** (the verdict card), and surfacing the methodology by default, will make users engage more deeply with the statistical content and convert better to taking the result with them.

Concretely, we expect **Variant B** to increase:

- methodology-toggle rate,
- per-cluster-sort rate, and
- **PDF-download rate** (the primary metric),

without harming the core completion flow.

---

## Variants

Assignment is per session in `apps/frontend/app.py` via `_layout_variant()`.

| Aspect | **Variant A — control** | **Variant B — treatment** |
|--------|-------------------------|---------------------------|
| Top of results page | **Verdict card** | **Forest plot** (per-cluster CI) |
| Below | Forest plot | Verdict card, as a summary |
| Methodology expander | **Collapsed** by default | **Expanded** by default |
| Framing | Conclusion-first | Evidence-first |

Everything else (scoring, stats, copy, events) is held constant across variants so any difference is attributable to layout alone.

---

## Metrics

| Role | Metric | Definition | Direction |
|------|--------|-----------|-----------|
| **Primary** | PDF-download rate per session | sessions with `pdf_report_downloaded` ÷ sessions with `verdict_revealed` | ↑ for B |
| Secondary | Methodology-toggle rate | sessions with `methodology_toggled` ÷ sessions with `verdict_revealed` | ↑ for B |
| Secondary | Per-cluster-sort rate | sessions with `per_cluster_table_sorted` ÷ sessions with `verdict_revealed` | ↑ for B |
| Secondary | Result-share rate | sessions with `result_shared` ÷ sessions with `verdict_revealed` | ↑ for B |
| **Guardrail** | Comparison completion rate | `verdict_revealed` ÷ `comparison_run` | must not drop |

All metrics derive from the PostHog event taxonomy defined in [`analytics.md`](../analytics.md). Because the methodology expander starts **expanded** in Variant B, the `methodology_toggled` secondary metric should be interpreted with care: B's lift there partly reflects the default state, so the **PDF-download primary metric** remains the decision driver.

---

## Sample size & decision rule

- **Randomization unit:** session (via `_layout_variant()`), 50/50 split.
- **Analysis method:** PostHog **native Bayesian A/B testing**. We report the **probability that B beats A** on the primary metric and the **expected loss / credible interval**, rather than a fixed-horizon p-value.
- **Decision rule (illustrative, pre-launch):**
  - **Ship B** if P(B > A) on PDF-download rate clears a high posterior threshold (e.g. ≥ 95%) **and** the comparison-completion guardrail shows no meaningful regression.
  - **Keep A** if P(B > A) is low (e.g. ≤ 5%) or the guardrail regresses.
  - **Keep running** while the posterior is inconclusive and the guardrail is stable.
- **Minimum exposure:** run until each variant accumulates enough sessions for the posterior to stabilize; since traffic is unknown pre-launch, the concrete sample-size target will be fixed once a baseline conversion rate and a minimum detectable effect are chosen. The Bayesian setup tolerates continuous monitoring, so we can read results as they accrue without inflating error in the way a naive fixed-horizon t-test would.

> All thresholds and effect sizes above are **targets / illustrative** — no live data exists yet.

---

## Why this is a good dogfood

The product preaches: *don't trust a single number, look at the distribution, correct for multiple comparisons, and use a method that's valid under continuous monitoring.* This experiment honors that preaching for our own UI — primary metric chosen up front, guardrail defined, Bayesian analysis that supports peeking, and an explicit decision rule. If we wouldn't ship a resume verdict without rigor, we shouldn't ship a layout change without it either.
