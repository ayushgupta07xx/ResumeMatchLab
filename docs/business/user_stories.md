# User Stories & Backlog — ResumeMatch Lab

Twelve user stories for ResumeMatch Lab, written against the three personas defined in [`personas.md`](./personas.md): **Fresh-Graduate Anjali**, **Career-Switcher Rohit**, and **Senior Hire Sneha**. Stories are grouped into five epics and estimated in Fibonacci story points (1/2/3/5/8/13). Acceptance criteria use Given / When / Then.

**Story-point legend:** 1 = trivial · 2 = small · 3 = moderate · 5 = substantial · 8 = large/complex · 13 = epic-sized, likely to split.

---

## Epic A — Upload & Parse

### US-1 — Upload two resume variants
**As** Fresh-Graduate Anjali, **I want** to upload two versions of my resume (Variant A and Variant B) in one place, **so that** I can compare them without juggling files or accounts.

**Acceptance criteria**
- **Given** I am on the home screen, **when** I drop or select two PDF/DOCX files, **then** both are accepted and labelled "Variant A" and "Variant B".
- **Given** I upload only one file, **when** I try to run the test, **then** the app blocks the run and prompts me for a second variant.
- **Given** a file exceeds the size or page limit, **when** I upload it, **then** I see a clear, non-technical error message.

**Points:** 3 · **Priority:** Must

---

### US-2 — Reliable text extraction from messy resumes
**As** Career-Switcher Rohit, **I want** the app to extract text correctly from my multi-column, icon-heavy resume, **so that** my scores reflect my actual content and not a parsing failure.

**Acceptance criteria**
- **Given** a two-column PDF, **when** it is parsed, **then** reading order is preserved and no large block of text is dropped.
- **Given** an image-only / scanned PDF that cannot be parsed, **when** I upload it, **then** I am warned that text could not be extracted and asked to upload a text-based file.
- **Given** parsing succeeds, **when** I expand a "view extracted text" panel, **then** I can confirm the app read what I intended.

**Points:** 5 · **Priority:** Must

---

## Epic B — Scoring & Verdict

### US-3 — Score each variant against the live job corpus
**As** Fresh-Graduate Anjali, **I want** each resume scored against real Indian tech job postings, **so that** my result reflects the actual market and not a generic checklist.

**Acceptance criteria**
- **Given** two parsed resumes, **when** I run the test, **then** each variant is embedded (bge-small-en-v1.5, 384-dim) and scored against all 2,000 postings.
- **Given** scoring completes, **when** I view the result, **then** I see a single market-fit score for each variant.
- **Given** scoring is running, **when** I wait, **then** a progress indicator shows the run is active and finishes within a reasonable time on Streamlit Community Cloud.

**Points:** 5 · **Priority:** Must

---

### US-4 — Plain-language verdict card
**As** Fresh-Graduate Anjali, **I want** a one-line verdict telling me which resume wins and by how much, **so that** I can decide which version to send without understanding statistics.

**Acceptance criteria**
- **Given** the test has run, **when** I see the verdict card, **then** it states the winner, the point gap, the 95% confidence interval, and the p-value (e.g. "Resume B wins by 8.4 points, 95% CI [4.1, 12.7], p<0.001").
- **Given** the difference is not statistically significant, **when** I read the verdict, **then** it says the variants are effectively tied rather than declaring a false winner.
- **Given** I am non-technical, **when** I read the card, **then** the headline is in plain English with the statistics available but not required.

**Points:** 3 · **Priority:** Must

---

### US-5 — Always-valid significance as I iterate
**As** Career-Switcher Rohit, **I want** the significance test to stay valid even when I re-run it after editing my resume, **so that** repeated checking doesn't trick me into a false "win".

**Acceptance criteria**
- **Given** I re-run the test multiple times on tweaked drafts, **when** results are reported, **then** an mSPRT always-valid p-value is shown alongside the fixed-sample p-value.
- **Given** the sequential test has not crossed its boundary, **when** I view the verdict, **then** I am told the result is not yet conclusive rather than encouraged to stop early.

**Points:** 8 · **Priority:** Should

---

### US-6 — Variance-reduced, trustworthy effect size
**As** Senior Hire Sneha, **I want** the comparison to control for noise and report a real effect size, **so that** I can trust the gap between my two framings is genuine.

**Acceptance criteria**
- **Given** both variants are scored on the same postings, **when** the test runs, **then** a paired test (t-test/Wilcoxon) is used and CUPED variance reduction is applied.
- **Given** the result, **when** I inspect details, **then** Cohen's d and a power-analysis read are reported so I can judge practical significance.
- **Given** low power, **when** I view the verdict, **then** I am warned the comparison may be under-powered.

**Points:** 8 · **Priority:** Should

---

## Epic C — Insight & Drill-down

### US-7 — Per-cluster forest plot
**As** Career-Switcher Rohit, **I want** to see how each variant scores across the 8 job clusters, **so that** I can confirm my rewrite moves me toward analytics and away from QA.

**Acceptance criteria**
- **Given** the test has run, **when** I open the cluster view, **then** a forest plot shows the per-cluster A-vs-B difference with confidence intervals for all 8 clusters (Data Engineering, Data & Analytics, ML/AI, DevOps/SRE/Cloud, Backend, Frontend/Mobile, Product Management, QA/Testing).
- **Given** I look at a specific cluster, **when** I read its row, **then** I can tell whether B beat A there and whether that cluster's difference is significant.

**Points:** 5 · **Priority:** Must

---

### US-8 — Multiple-comparison correction across clusters
**As** Senior Hire Sneha, **I want** per-cluster claims corrected for multiple comparisons, **so that** I'm not misled by one cluster looking significant purely by chance.

**Acceptance criteria**
- **Given** 8 clusters are tested at once, **when** per-cluster significance is shown, **then** Bonferroni and BH-FDR corrected results are reported.
- **Given** a cluster is significant raw but not after correction, **when** I view it, **then** the corrected (more conservative) status is what's flagged to me.

**Points:** 3 · **Priority:** Should

---

### US-9 — Bayesian "probability B is better" readout
**As** Fresh-Graduate Anjali, **I want** a simple "chance that B is actually better" number, **so that** I can understand the result intuitively without reading a p-value.

**Acceptance criteria**
- **Given** the test has run, **when** I view the Bayesian panel, **then** a Beta-Binomial posterior shows P(B > A) as a percentage and a posterior plot.
- **Given** the posterior is near 50%, **when** I read the panel, **then** it tells me the evidence is inconclusive in plain words.

**Points:** 5 · **Priority:** Should

---

## Epic D — Trust & Privacy

### US-10 — Privacy by default (in-memory only)
**As** Senior Hire Sneha, **I want** my resume processed in memory and never stored, **so that** I can use the tool while employed without risking a leak.

**Acceptance criteria**
- **Given** I upload my resumes, **when** the session ends or I refresh, **then** no resume content persists on the server.
- **Given** I am on the page, **when** I look for a privacy statement, **then** a visible note confirms files are processed in-memory only and never saved.
- **Given** I never create an account, **when** I use the tool, **then** no sign-up, email, or payment is required to run a test.

**Points:** 3 · **Priority:** Must

---

### US-11 — Transparent methodology
**As** Career-Switcher Rohit, **I want** to see how the score and verdict are computed, **so that** I can trust the result instead of treating it as a black-box grade.

**Acceptance criteria**
- **Given** I view the results, **when** I open a "methodology" or "how this works" section, **then** the embedding model, corpus size (2,000 postings), test type, and CI method are clearly described.
- **Given** I want context, **when** I read the methodology, **then** the known limitations (embedding-as-proxy, single snapshot) are stated honestly.

**Points:** 2 · **Priority:** Should

---

## Epic E — Export & Share

### US-12 — Downloadable PDF report
**As** Senior Hire Sneha, **I want** to download a polished PDF of the verdict, plots, and methodology, **so that** I can revisit it offline and reason about my next iteration.

**Acceptance criteria**
- **Given** a completed test, **when** I click "Download report", **then** a PDF is generated containing the verdict card, per-cluster forest plot, distributions, and the Bayesian posterior.
- **Given** the PDF is generated, **when** I open it, **then** it is self-contained and readable without the app, and contains no stored copy of my raw resume on any server.

**Points:** 5 · **Priority:** Could

---

## Backlog summary

| ID | Story | Epic | Persona | Points | Priority |
|---|---|---|---|---|---|
| US-1 | Upload two resume variants | Upload & Parse | Anjali | 3 | Must |
| US-2 | Reliable text extraction | Upload & Parse | Rohit | 5 | Must |
| US-3 | Score against live corpus | Scoring & Verdict | Anjali | 5 | Must |
| US-4 | Plain-language verdict card | Scoring & Verdict | Anjali | 3 | Must |
| US-5 | Always-valid sequential testing | Scoring & Verdict | Rohit | 8 | Should |
| US-6 | Variance-reduced effect size | Scoring & Verdict | Sneha | 8 | Should |
| US-7 | Per-cluster forest plot | Insight & Drill-down | Rohit | 5 | Must |
| US-8 | Multiple-comparison correction | Insight & Drill-down | Sneha | 3 | Should |
| US-9 | Bayesian P(B > A) readout | Insight & Drill-down | Anjali | 5 | Should |
| US-10 | Privacy by default | Trust & Privacy | Sneha | 3 | Must |
| US-11 | Transparent methodology | Trust & Privacy | Rohit | 2 | Should |
| US-12 | Downloadable PDF report | Export & Share | Sneha | 5 | Could |

**Totals:** 12 stories · 55 points · MoSCoW split — Must: 24 pts (6 stories), Should: 26 pts (5 stories), Could: 5 pts (1 story).

### Suggested release slicing
- **MVP (Must, 24 pts):** US-1, US-2, US-3, US-4, US-7, US-10 — a complete, trustworthy, free A/B test with cluster breakdown and privacy.
- **v1.1 (Should, 26 pts):** US-5, US-6, US-8, US-9, US-11 — the statistical-rigor layer that wins over Rohit and Sneha.
- **v1.2 (Could, 5 pts):** US-12 — shareable PDF artefact for portfolio and offline iteration.
