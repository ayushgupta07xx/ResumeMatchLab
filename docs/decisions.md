# Architecture Decision Records

Short ADRs capturing the *why* behind ResumeMatch Lab's key choices.

## ADR-1: Reuse JobAtlas's corpus and embeddings
**Context.** ResumeMatch needs a representative job corpus with embeddings. The sibling
project JobAtlas already has ~9,000 deduplicated Indian tech jobs embedded with
`BAAI/bge-small-en-v1.5` in Postgres.
**Decision.** Export 9,014 active, non-duplicate jobs *with their existing vectors* into
committed Parquet (`scripts/export_from_jobatlas.py`).
**Consequences.** Real data, zero re-embedding of the corpus, and — crucially — the two
products share one job universe and identical vectors (consistency story). The app
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
free hosting. Trade-off: less pixel control, accepted for an analytics product.

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
cost for N = 9,014.

## ADR-6: CUPED on job-side covariates (not resume-level)
**Context.** The original spec named resume-level covariates (length, skill density), but
those are constant across the 9,014 jobs and cannot reduce per-job variance.
**Decision.** Use job-side covariates — cluster one-hot + job-description length — and
residualize the deltas.
**Consequences.** Genuine, defensible variance reduction (~50% in the demo, driven by
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

## ADR-13: Whole-document cosine scoring — known breadth bias, no practical-significance floor

**Status:** Accepted

**Context**
Stress-testing the live `/compare` endpoint with two near-duplicate résumé versions (a DevOps-specialist CV vs. a generalist CV sharing ~90% of their text) surfaced behaviour that reads as wrong but is arithmetically correct and reproducible:
- The DevOps CV scored *lower* on the DevOps/SRE/Cloud cluster than the generalist CV (Δ +0.88pp, BH-FDR p≈0) and *higher* on Frontend/ML/Design.
- Every per-cluster gap was significant (cluster N = 313–1,590; CIs clear of zero) yet tiny in absolute terms (0.1–2.0pp on a ~62pp base). Overall Δ −0.30pp, p≈10⁻⁸³.

Root causes:
1. **Near-duplicate inputs.** When two résumés share most of their text, the paired per-job deltas have near-zero variance, so absolute gaps collapse to sub-2pp while Cohen's d stays moderate-to-large (DevOps cluster d≈0.86; overall d≈0.22). Significance and effect size both look "real"; absolute magnitude does not.
2. **Whole-document mean-pooled cosine rewards breadth over specialisation.** A specialist CV dense with niche jargon (multi-burn-rate alerting, ServerSideApply) sits *farther* from the centroid of generically-worded postings than a generalist CV that covers the same tools in plainer language plus broad SWE vocabulary. The per-cluster sign tracks proximity-to-JD-centroid, not recruiter-style domain fit.

**Decision**
1. **No practical-significance floor on the verdict or forest.** A Cohen's-d floor is the wrong lever — low within-pair variance inflates d, so it would grey out nothing. An absolute-pp floor has no principled anchor: the product scores only two résumés against the corpus and has no résumé-score population to calibrate "meaningful," so any threshold is arbitrary and indefensible.
2. **Keep mean-pooled whole-document cosine** as the scorer, and **document its breadth bias** in the public methodology (`/how-it-works`): per-cluster signs are directional, not a recruiter verdict.
3. **Defer** a domain-fit-aware scorer (per-skill max-similarity / late-interaction, or a cross-encoder rerank) to a separate change — it re-baselines every published figure and needs full re-validation. Tracked as future work, not done here.

**Consequences**
- The forest stays honest about *magnitude* (real CIs, real signs) but is explicitly framed as embedding-similarity, not fit.
- Two near-identical résumé versions correctly return a near-coin-flip win rate; the product never claims a large difference where none exists.
- The breadth-bias limitation is a documented known issue, not a silent flaw — and a defensible interview talking point.


## ADR-14: Chunk max-sim scorer shipped; skill-overlap blend rejected; per-cluster claim reframed

**Status:** Accepted (supersedes ADR-13's "keep mean-pooled cosine" decision)

**Context**
ADR-13 documented the breadth bias of whole-document mean-pooled cosine and deferred the fix. This change ships the fix and records what was and was not adopted, using the canonical DevOps-specialist (A) vs data-scientist (B) reference pair.

**Decision**
1. **Ship asymmetric chunk max-sim.** `core/scoring.py` embeds each resume as `(C, 384)` line/bullet chunks and scores every job against the resume's best-matching chunk (`(jobs @ chunks.T).max(axis=1)`), replacing the single mean-pooled vector. A specialist bullet now lifts its own resume instead of being averaged toward the corpus centroid.
2. **Reject the skill-overlap blend.** An `alpha*chunk_maxsim + (1-alpha)*skill_overlap` blend was evaluated across alpha 1.0 -> 0.2. Every alpha left DevOps / SRE / Cloud favouring the broad resume, and pure skill-overlap favoured it *more* — so no alpha flips the cluster without target-fitting a predetermined result. Rejected as unprincipled; not shipped.
3. **Reframe the per-cluster claim.** "A specialist tops its own cluster" is false for a K-means *macro*-cluster. A probe of DevOps / SRE / Cloud (826 jobs) found the specialist wins the pure-infrastructure JDs (10 jobs, overlap 0.636 vs 0.438) but the cluster is ~92% mixed cloud / data-platform roles the data-scientist resume legitimately matches. Honest claim: max-sim removes the mean-pool centroid bias and the specialist wins its pure-role JDs; a heterogeneous cluster mean reflects its dominant sub-population.

**Consequences**
- Canonical Numbers re-baselined to the max-sim run: A wins 2.01 pts (BCa [1.91, 2.12]); per-cluster ML/AI +3.54, DevOps/SRE/Cloud +3.60; CUPED 43.8% (effective N x1.78); Bayes k=2,578. README, case study, example-verdict, and /how-it-works were updated in the same change.
- `/how-it-works` now describes best-matching-chunk scoring and the heterogeneous-cluster caveat, replacing the whole-document breadth note.
- ADR-13 remains as the historical near-duplicate stress-test record; its "keep mean-pooled cosine" decision is superseded here.
