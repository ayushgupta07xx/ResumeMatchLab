# Market Sizing — ResumeMatch Lab (India)

A TAM / SAM / SOM estimate for ResumeMatch Lab in the Indian resume-tooling and job-seeker market, using **both** a top-down funnel and a bottom-up ARPU build. The figures below are **illustrative estimates built on explicitly stated assumptions**, not verified market statistics. They are intended to demonstrate sizing method and order-of-magnitude reasoning — a hiring manager should read every number as "given these assumptions, the math implies…".

**FX assumption used throughout:** US$1 ≈ ₹84.

> ### How to read this document
> - **TAM** = the total value if every relevant job seeker in India used a paid resume tool.
> - **SAM** = the slice ResumeMatch can realistically serve (online, tech-leaning, willing to engage with a digital resume tool).
> - **SOM** = the share a small, free, early-stage product could plausibly capture in 2–3 years.

---

## Stated assumptions (read these first)

| # | Assumption | Estimate used | Basis / note |
|---|---|---|---|
| A1 | India active online job seekers (annual) | ~120 million | Order-of-magnitude estimate of India's online-active workforce engaging in job search; treat as a planning figure, not a census. |
| A2 | Share who are tech / white-collar knowledge workers | ~15% | Tech + adjacent white-collar roles as a fraction of online job seekers. |
| A3 | Share who use *any* online resume tool | ~25% | Of tech seekers, those who touch a builder/scorer/optimizer at least once a year. |
| A4 | Share open to a *job-market-grounded A/B* tool | ~40% | Of resume-tool users, those who would value rigorous comparison over a basic builder. |
| A5 | Willing-to-pay conversion (consumer) | ~5% | Freemium-typical paid conversion for a useful but non-essential tool. |
| A6 | Blended consumer ARPU (paying users, annual) | ₹600 / yr (~US$7) | A one-time/occasional ₹200–500 purchase plus some repeat; mid-funnel persona Rohit anchors this. |
| A7 | TAM "full monetization" ARPU (hypothetical) | ₹500 / yr (~US$6) | Hypothetical average if *every* TAM user paid something — used only for the top-down TAM ceiling. |
| A8 | SOM reach as share of SAM (years 2–3) | ~2% | Realistic capture for a free, single-founder, organically-distributed app. |

All downstream numbers are derived purely from A1–A8. Change an assumption, change the result.

---

## Method 1 — Top-down funnel

Starting from India's online job seekers and narrowing by relevance and willingness to pay.

| Funnel stage | Applied assumption | Users | Cumulative |
|---|---|---|---|
| Online job seekers (India, annual) | A1 | 120,000,000 | 120.0 M |
| → Tech / white-collar | × 15% (A2) | 18,000,000 | 18.0 M |
| → Use any online resume tool | × 25% (A3) | 4,500,000 | 4.5 M |
| → Open to market-grounded A/B tool | × 40% (A4) | 1,800,000 | 1.8 M |
| → Willing to pay (consumer) | × 5% (A5) | 90,000 | 90.0 K |

**Top-down market values**

| Metric | Definition | Users | Annual value (₹) | Annual value (US$) |
|---|---|---|---|---|
| **TAM** | All tech resume-tool users × hypothetical full-monetization ARPU (A7) | 4.5 M | 4.5 M × ₹500 = **₹225 crore** | **~US$26.8 M** |
| **SAM** | Users open to a market-grounded A/B tool (A4) × consumer ARPU (A6) | 1.8 M | 1.8 M × ₹600 = **₹108 crore** | **~US$12.9 M** |
| **SOM** | ~2% of SAM users (A8) × consumer ARPU (A6) | 36 K | 36 K × ₹600 = **₹2.16 crore** | **~US$257 K** |

> *Note on TAM:* ₹225 crore is a deliberately loose ceiling — it assumes every tech resume-tool user pays an average ₹500/yr, which no resume tool achieves. It bounds the opportunity; SAM and SOM are the planning numbers.

---

## Method 2 — Bottom-up (ARPU × addressable users)

Building up from the unit economics of the realistic addressable base (the 1.8 M "open to A/B" SAM users from A4) rather than from the total population. This cross-checks the top-down result.

**Step 1 — segment the SAM by persona archetype**

| Persona archetype | Share of SAM | Users | Paying conversion | Paying users | ARPU (₹/yr) | Segment revenue (₹) |
|---|---|---|---|---|---|---|
| Freshers (Anjali) | 50% | 900,000 | 2% | 18,000 | ₹150 | ₹27.0 L |
| Switchers (Rohit) | 35% | 630,000 | 8% | 50,400 | ₹700 | ₹3.53 cr |
| Seniors (Sneha) | 15% | 270,000 | 10% | 27,000 | ₹1,200 | ₹3.24 cr |
| **Total** | 100% | 1,800,000 | — | 95,400 | — | **₹7.04 crore** |

**Step 2 — bottom-up SAM and SOM**

- **Bottom-up SAM (fully penetrated):** ₹7.04 crore/yr (~US$838 K) if ResumeMatch served *every* addressable user at these conversion rates. This is lower than the top-down SAM because it uses persona-specific (more conservative) conversion and ARPU rather than a single blended ARPU across all 1.8 M.
- **Bottom-up SOM (years 2–3, ~2% reach, A8):** ~₹14 lakh/yr (~US$17 K) at 2% penetration of the addressable base.

**Reconciliation:** Top-down SOM (₹2.16 cr) and bottom-up SOM (₹14 L) differ because the top-down applies a blended ARPU to *all* reached users while the bottom-up applies a low per-segment paying conversion. The truth sits between them; the realistic early-revenue planning range is therefore **≈ ₹15 L – ₹2 cr/yr (~US$18 K – US$257 K)**, dominated by switchers and seniors, not freshers.

---

## Monetization sketch (freemium)

| Tier | Price | Who | What they get |
|---|---|---|---|
| **Free** | ₹0 | Anjali, all top-of-funnel | One full A/B test, verdict card, per-cluster forest plot, in-memory privacy, single PDF report |
| **Pro (one-time / occasional)** | ₹299–499 per deep run | Rohit | Unlimited reruns, saved comparison history, deeper drill-down, always-valid sequential view, draft-over-draft tracking |
| **Senior / Power** | ₹999–1,499 (quarterly or per intensive session) | Sneha | Senior-role-tuned corpus slices, multiple-framing comparison, power-analysis guidance, priority compute, premium PDF |

**Logic:** the free tier is the acquisition and credibility engine (great for freshers and word-of-mouth, ₹0 to operate on Streamlit Community Cloud). Revenue concentrates in the **switcher and senior tiers**, exactly where willingness-to-pay and per-user value are highest, which is consistent with the bottom-up segment math above.

---

## B2B pivot idea (the larger prize)

Consumer freemium tops out at low crores under these assumptions; the institutional channel is where contract value scales.

| B2B segment | Buyer | Offering | Indicative deal size (estimate) |
|---|---|---|---|
| **Campus placement cells** | Tier-2/3 college TPOs | Batch-score a graduating cohort's resumes; anonymized cluster-readiness dashboard ("60% of batch under-indexes on Data Engineering") | ₹50,000 – ₹2,00,000 / college / year |
| **Corporate HR / L&D** | Internal mobility & reskilling teams | A/B internal-applicant resumes against internal role clusters; reskilling gap analysis | ₹2,00,000 – ₹10,00,000 / enterprise / year |
| **Bootcamps / edtech** | Placement-outcome-driven course providers | White-label resume A/B as a graduation deliverable; outcome reporting | Revenue-share or ₹1–5 L / cohort |

**Why it works:** the *same engine* (embeddings + cluster scoring + statistical A/B) produces cohort-level analytics with near-zero marginal cost, while contract values are 100×–1000× a consumer purchase. A realistic B2B beachhead — **20 placement cells at ₹1 L each = ₹20 lakh/yr** — already rivals the entire bottom-up consumer SOM, on a fraction of the user count.

---

## Summary

| Metric | Top-down (₹) | Top-down (US$) | Bottom-up (₹) | Bottom-up (US$) |
|---|---|---|---|---|
| **TAM** | ₹225 cr | ~US$26.8 M | — (ceiling not re-derived bottom-up) | — |
| **SAM** | ₹108 cr | ~US$12.9 M | ₹7.04 cr | ~US$838 K |
| **SOM (yr 2–3)** | ₹2.16 cr | ~US$257 K | ₹14 L | ~US$17 K |

**Bottom line:** Under stated assumptions, the consumer opportunity is a low-single-digit-crore SOM concentrated in switchers and seniors, with a **B2B placement-cell / HR pivot offering the most credible path to scale**. Every figure here is assumption-driven and should be validated against real funnel data before any business decision.
