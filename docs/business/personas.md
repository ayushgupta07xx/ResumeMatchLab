# User Personas — ResumeMatch Lab

ResumeMatch Lab is a free Streamlit web app that lets a job seeker upload **two versions of their resume** (Variant A and Variant B), embeds both with a sentence-transformer model (BAAI/bge-small-en-v1.5, 384-dim), and runs a **statistically rigorous A/B test** of each version against a snapshot of **2,000 real Indian tech job postings** across 8 job clusters. The output is a verdict card ("Resume B wins by 8.4 points, 95% CI [4.1, 12.7], p<0.001"), a per-cluster forest plot, score distributions, a Bayesian posterior, and a downloadable PDF report.

These three personas anchor every other artefact in this package (user stories, SWOT, market sizing, competitive analysis). They represent the three highest-value segments of the Indian tech job-seeker funnel: the **fresher**, the **career switcher**, and the **selective senior**.

---

## Persona 1 — Fresh-Graduate Anjali

> "I have one resume, I've sent it to 60 companies, and I have no idea why nobody replies."

| Attribute | Detail |
|---|---|
| **Age / stage** | 21, final-year B.Tech (IT), tier-2 college in Nagpur |
| **Target roles** | Data Analyst, Associate Data Engineer, fresher SDE |
| **Experience** | 2 internships (one unpaid), 3 academic projects, 0 full-time |
| **Salary expectation** | ₹4–7 LPA |
| **Tech proficiency** | High comfort with apps and web tools; never used a statistics tool; thinks "ATS" is a buzzword she half-understands |
| **Tools today** | Free Canva resume template, Naukri free profile, LinkedIn Easy Apply, college placement portal |
| **Budget** | Effectively ₹0 — will not pay a subscription on a student budget |

### A day in the life
Anjali wakes up, checks her placement-cell WhatsApp group, and sees three new openings. She tweaks two lines of her resume from memory, exports a fresh PDF, and mass-applies through the portal and LinkedIn before her 10 a.m. lab. By evening she has 40 "application sent" confirmations and zero callbacks. She doom-scrolls LinkedIn posts that say "your resume must beat the ATS" but none of them tell her *what specifically* in her resume is weak, or whether the "data analyst" version she made last week is actually better than her old generic one.

### Goals
- Land her **first full-time role** before campus placements end.
- Know, objectively, which of her two resume drafts performs better — not just which one "looks nicer".
- Understand which job clusters (Data & Analytics vs. Data Engineering vs. ML/AI) she is actually competitive for.

### Pain points
- **No feedback loop.** Rejections are silent; she cannot tell a good resume from a bad one.
- **No money.** Resume Worded, Enhancv, and Teal all gate the useful features behind paid tiers.
- **Guesswork.** Advice online is generic and contradictory; she needs an answer for *her* resume against *Indian* jobs.

### How ResumeMatch helps Anjali
- She uploads her old generic resume (A) and her new "data analyst" version (B). The verdict card tells her in plain language that **B wins by 8.4 points (p<0.001)** — she finally has a reason to commit to one draft.
- The **per-cluster forest plot** shows she scores well against *Data & Analytics* but poorly against *Data Engineering*, so she stops wasting applications on the wrong cluster.
- It costs **₹0**, runs in the browser, and her resume is **never stored** — no credit card, no privacy worry.

---

## Persona 2 — Career-Switcher Rohit

> "I've been a manual tester for four years. On paper I look like a QA guy, but I want to be a data analyst — does my new resume actually read like one?"

| Attribute | Detail |
|---|---|
| **Age / stage** | 27, 4 years experience, Pune |
| **Current role** | Manual QA / Test Engineer at a mid-size IT services firm |
| **Target roles** | Data Analyst, BI Analyst, Analytics Engineer |
| **Experience** | Strong domain knowledge, self-taught SQL + Python + Power BI via online courses |
| **Salary expectation** | Lateral-to-slight-up move, ₹9–13 LPA |
| **Tech proficiency** | Strong — comfortable with SQL, dashboards, basic statistics; *trusts a number more than an opinion* |
| **Tools today** | Naukri paid resume display, one Teal trial, LinkedIn premium (1-month trial) |
| **Budget** | Will pay ₹200–500 one-time for a clearly useful result; subscription-averse |

### A day in the life
Rohit works a full QA day, then studies analytics from 9 to 11 p.m. He has rebuilt his resume to foreground his SQL projects and a churn-analysis capstone, and buried the "manual testing" language. But he is anxious: recruiters keep slotting him back into QA/Testing roles. He cannot tell whether his rewrite genuinely repositions him toward analytics, or whether the old "tester" signal still dominates the document. He needs evidence, not vibes.

### Goals
- **Prove repositioning works** — confirm the rewritten resume reads as "analytics", not "QA".
- Quantify how far he has moved *away from* the QA/Testing cluster and *toward* Data & Analytics.
- Avoid burning his limited recruiter goodwill on a resume that still signals the wrong role.

### Pain points
- **Identity ambiguity.** His experience pulls toward QA; his ambition pulls toward analytics. He needs to know which signal wins.
- **Generic ATS scores are useless** for a switcher — keyword matching rewards his old QA keywords, exactly what he is trying to escape.
- **Trust.** He distrusts tools that give a vague "82/100" with no methodology.

### How ResumeMatch helps Rohit
- The **per-cluster breakdown** is his killer feature: he can literally watch his score **rise on Data & Analytics and fall on QA/Testing** between Variant A (old) and Variant B (rewritten). That is the repositioning proof he wanted.
- The **statistical rigor** (paired test, bootstrap CI, Cohen's d, Bayesian posterior) earns his trust — he sees a confidence interval, not a mystery grade.
- The downloadable **PDF report** gives him an artefact to reason about and revisit as he iterates draft C.

---

## Persona 3 — Senior Hire Sneha

> "I'm not spraying applications. I'll apply to maybe five roles this quarter, and each resume needs to be tuned. I want the version that lands."

| Attribute | Detail |
|---|---|
| **Age / stage** | 33, 8 years experience, Bengaluru |
| **Current role** | Senior Product Manager at a Series-C startup |
| **Target roles** | Lead PM, Group PM, Director of Product |
| **Experience** | Shipped 0→1 and scaling products; manages a small team; strong on outcomes/metrics |
| **Salary expectation** | ₹45–70 LPA, equity-sensitive |
| **Tech proficiency** | Very high product/analytics literacy; reads experiment results for a living; scrutinizes methodology |
| **Tools today** | Bespoke resume she maintains herself, warm referrals, executive-search recruiters |
| **Budget** | Will pay for genuine signal, but is allergic to gimmicks and template-y tools |

### A day in the life
Sneha rarely job-hunts in volume. When she does move, it's deliberate — a handful of senior roles, each worth a tailored application. She keeps two resume framings: one **metrics-forward** (Variant A, heavy on revenue/retention numbers) and one **leadership-forward** (Variant B, heavy on team and strategy). She wants to know which framing resonates more with the *actual* senior Product Management postings in the market right now, not with a generic best-practice checklist written for freshers.

### Goals
- Pick the **single strongest framing** for senior PM/lead roles, backed by evidence.
- Confirm the difference between her two framings is **real, not noise** before she commits.
- Maintain absolute **privacy** — she is employed and does not want her resume sitting in a vendor's database.

### Pain points
- **Most resume tools are built for freshers** and score her on irrelevant junior keywords.
- **No senior-role grounding.** Generic ATS scoring ignores that "Lead PM" expectations differ sharply from "Associate PM".
- **Privacy risk.** A senior, currently-employed candidate cannot afford a leak.

### How ResumeMatch helps Sneha
- The A/B test answers her exact question — **metrics-forward vs. leadership-forward against live Product Management postings** — and the **bootstrap CI + power analysis** tell her whether the gap is statistically real or just sampling noise (the thing she most wants to avoid getting wrong).
- The corpus is **role-aware**: she is scored against the Product Management cluster, not generic SDE keywords.
- **In-memory only, never persisted** — privacy by default is a feature she actively checks for, and it removes her single biggest objection.

---

## Persona summary table

| Dimension | Fresh-Graduate Anjali | Career-Switcher Rohit | Senior Hire Sneha |
|---|---|---|---|
| **Age / experience** | 21 / fresher | 27 / 4 yrs | 33 / 8 yrs |
| **Location** | Nagpur (tier-2) | Pune | Bengaluru |
| **Current → target** | Student → Data Analyst | Manual QA → Data Analyst | Senior PM → Lead/Group PM |
| **Application volume** | Very high (spray) | Medium (targeted) | Very low (selective) |
| **Tech / stats literacy** | Low | High | Very high |
| **Willingness to pay** | ₹0 (student) | ₹200–500 one-time | Pays for real signal |
| **Primary job clusters** | Data & Analytics, Data Eng | Data & Analytics vs. QA/Testing | Product Management |
| **Killer feature for them** | Plain-language verdict + free | Per-cluster repositioning proof | Statistical rigor + privacy |
| **Biggest objection removed** | Cost | "Generic ATS is useless to me" | Privacy + senior-role grounding |

---

### Why these three
Together they cover the breadth of the funnel ResumeMatch must serve: **high-volume price-sensitive freshers** (acquisition and word-of-mouth engine), **deliberate switchers** (the segment most under-served by keyword tools and most willing to pay), and **selective seniors** (low volume but high credibility, and the strongest validators of the statistical methodology). Every user story, monetization assumption, and competitive claim in this package is written to serve at least one of these three.
