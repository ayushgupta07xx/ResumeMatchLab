# Architecture Decision Records

Short ADRs capturing the *why* behind ResumeMatch Lab's key choices.

## ADR-1: Reuse JobAtlas's corpus and embeddings
**Context.** ResumeMatch needs a representative job corpus with embeddings. The sibling
project JobAtlas already has ~9,000 deduplicated Indian tech jobs embedded with
`BAAI/bge-small-en-v1.5` in Postgres.
**Decision.** Export 2,000 active, non-duplicate jobs *with their existing vectors* into
committed Parquet (`scripts/export_from_jobatlas.py`).
**Consequences.** Real data, zero re-embedding of the corpus, and — crucially — the two
portfolio projects share one job universe and identical vectors (consistency story). The app
ships the snapshot and runs fully offline.

## ADR-2: BGE-small, normalized, no instruction prefix
**Context.** Resumes must be embedded the same way the jobs were, or cosine similarity is
meaningless.
**Decision.** Mirror JobAtlas exactly: `BAAI/bge-small-en-v1.5`, `normalize_embeddings=True`,
no query prefix.
**Consequences.** Resume and job vectors live in one space; cosine = dot product → scoring is
a single fast matrix-vector product. 384-dim keeps it light on free-tier CPU.

## ADR-3: Streamlit over Next.js
**Context.** The product needs a UI fast, hosted free.
**Decision.** Streamlit + Streamlit Community Cloud; Next.js deferred as a stretch.
**Consequences.** Days of frontend work compress to hours; Python-native (no API boundary);
free hosting. Trade-off: less pixel control, accepted for a portfolio analytics product.

## ADR-4: Paired design with a normality-gated test
**Context.** Every job is scored by both resumes.
**Decision.** Analyze the per-job delta; choose paired t-test vs Wilcoxon by a Shapiro-Wilk
gate.
**Consequences.** Pairing removes job difficulty as nuisance variance (more power); the gate
picks the valid test automatically (embedding deltas are often non-normal → Wilcoxon).

## ADR-5: BCa bootstrap as the headline interval
**Context.** Delta distributions can be skewed; parametric CIs may mislead.
**Decision.** 10,000-resample bootstrap, report percentile **and** BCa; BCa is headline.
**Consequences.** Skew/bias-corrected interval, robust to non-normality, at trivial compute
cost for N = 2,000.

## ADR-6: CUPED on job-side covariates (not resume-level)
**Context.** The original spec named resume-level covariates (length, skill density), but
those are constant across the 2,000 jobs and cannot reduce per-job variance.
**Decision.** Use job-side covariates — cluster one-hot + job-description length — and
residualize the deltas.
**Consequences.** Genuine, defensible variance reduction (~55% in the demo, driven by
between-cluster structure). Deviation from spec documented openly (see methodology §8).

## ADR-7: mSPRT (Robbins mixture) for always-valid p-values
**Decision.** Implement Robbins's mixture SPRT; display an always-valid p-value and its
trajectory.
**Consequences.** Not operationally needed for a static snapshot, but a strong, honest
"peek any time" talking point; Type-I control verified by simulation in the test suite.

## ADR-8: Bayesian Beta-Binomial alongside frequentist
**Decision.** Model `[d_i > 0]` as Bernoulli; conjugate Beta(1,1) prior → Beta posterior.
**Consequences.** Communicates "probability B beats A" as an actual probability — far more
intuitive for non-technical users than a p-value; closed-form, no sampler.

## ADR-9: Per-cluster analysis with Bonferroni + BH-FDR
**Decision.** Test each of 8 clusters; report both corrections.
**Consequences.** Controls multiplicity while surfacing *where* a resume wins — the product's
core insight, shown as a forest plot.

## ADR-10: Static committed Parquet over a live API
**Decision.** Ship the snapshot in-repo; treat the JobAtlas live API as an optional, non-
default toggle.
**Consequences.** Standalone-demoable, reproducible (seed-pinned), and offline. No runtime
dependency on JobAtlas being up.

## ADR-11: reportlab text PDF (no headless browser)
**Decision.** Generate the downloadable report with reportlab tables, image-free.
**Consequences.** No kaleido/Chromium dependency on free-tier hosts; charts stay in the
interactive app.

## ADR-12: Privacy by construction
**Decision.** Resumes are processed in memory only, never persisted; PostHog receives
metadata only.
**Consequences.** A defensible privacy story; analytics functions are no-ops without a key.
