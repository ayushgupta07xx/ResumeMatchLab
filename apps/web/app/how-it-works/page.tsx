"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/providers";
import { ACC, FF } from "@/lib/theme";

function Tex({ tex }: { tex: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const html = katex.renderToString(tex, { displayMode: true, throwOnError: false });
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;
      const formula = inner.querySelector<HTMLElement>(".katex");
      const natural = formula ? formula.offsetWidth : inner.scrollWidth;
      const avail = wrap.clientWidth;
      setScale(natural > avail && natural > 0 ? Math.max(avail / natural, 0.5) : 1);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [html]);
  return (
    <div
      ref={wrapRef}
      style={{ display: "flex", justifyContent: "center", overflow: "hidden", margin: "12px 0 2px" }}
    >
      <div
        ref={innerRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "center center", display: "inline-block" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

type Step = { n: string; title: string; q: string; body: string; tex?: string[] };

const STEPS: Step[] = [
  {
    n: "01",
    title: "Semantic scoring",
    q: "How well does each résumé match each job?",
    body: "Both résumés and all 9,014 job descriptions are embedded with a sentence-transformer (BGE-small, 384 dimensions). Cosine similarity scores each résumé against every job, and subtracting gives one paired difference per job.",
    tex: [
      String.raw`\operatorname{score}(r,j)=\cos(\mathbf{e}_r,\mathbf{e}_j)=\dfrac{\mathbf{e}_r\cdot\mathbf{e}_j}{\lVert\mathbf{e}_r\rVert\,\lVert\mathbf{e}_j\rVert}`,
      String.raw`d_i=\operatorname{score}_B(i)-\operatorname{score}_A(i)`,
    ],
  },
  {
    n: "02",
    title: "Primary significance test",
    q: "Is the average difference real, or just noise?",
    body: "A Shapiro\u2013Wilk normality gate picks the test: a paired t-test when the deltas are roughly normal, the Wilcoxon signed-rank test otherwise. Both ask whether the typical paired difference is far from zero.",
    tex: [String.raw`\bar d=\frac{1}{N}\sum_{i=1}^{N}d_i,\qquad t=\dfrac{\bar d}{s_d/\sqrt{N}}`],
  },
  {
    n: "03",
    title: "Bootstrap confidence interval",
    q: "How precise is that difference?",
    body: "10,000 bootstrap resamples of the paired deltas build a bias-corrected and accelerated (BCa) 95% interval \u2014 no normality assumption, robust to skew.",
    tex: [String.raw`\widehat{\theta}^{*b}=\operatorname{mean}\big(\{d_i\}\ \text{resampled}\big),\qquad \text{CI}_{95\%}=\big[\widehat\theta^{*}_{(\alpha_1)},\,\widehat\theta^{*}_{(\alpha_2)}\big]_{\text{BCa}}`],
  },
  {
    n: "04",
    title: "Effect size",
    q: "Is the gap big enough to matter?",
    body: "Cohen's d expresses the mean delta in standard-deviation units \u2014 separating a statistically detectable gap from a practically meaningful one.",
    tex: [String.raw`d=\dfrac{\bar d}{s_d}`],
  },
  {
    n: "05",
    title: "Power & minimum detectable effect",
    q: "Could the test even detect a real effect?",
    body: "Achieved power and the sample needed for 80% power confirm 9,014 paired jobs has the resolution to detect small effects \u2014 the required N is tiny.",
    tex: [String.raw`\operatorname{MDE}_d=\dfrac{z_{1-\alpha/2}+z_{\,\text{power}}}{\sqrt{N}}`],
  },
  {
    n: "06",
    title: "CUPED variance reduction",
    q: "Can we sharpen the estimate?",
    body: "CUPED residualizes the deltas on pre-experiment covariates (job cluster, description length), stripping out variance unrelated to the résumés and nearly doubling the effective sample size.",
    tex: [
      String.raw`d_i^{\text{adj}}=d_i-\mathbf{X}_i^{\top}\hat{\boldsymbol\beta}+\bar d`,
      String.raw`\text{var. reduction}=1-\dfrac{\operatorname{var}(d^{\text{adj}})}{\operatorname{var}(d)}=R^2,\qquad N_{\text{eff}}=\dfrac{N}{1-R^2}`,
    ],
  },
  {
    n: "07",
    title: "Sequential testing (mSPRT)",
    q: "Could you stop early without cheating?",
    body: "A mixture Sequential Probability Ratio Test yields an always-valid p-value \u2014 correct even if you peek as jobs stream in, with no inflated false positives from optional stopping.",
    tex: [String.raw`\Lambda_n=\int\prod_{i\le n}\dfrac{f_\theta(d_i)}{f_0(d_i)}\,dH(\theta),\qquad p_n=\min\!\Big(1,\ \min_{m\le n}\tfrac{1}{\Lambda_m}\Big)`],
  },
  {
    n: "08",
    title: "Bayesian posterior",
    q: "What's the probability B is actually better?",
    body: "Treating each job as a win or loss, a Beta-Binomial model gives the full posterior over the fraction of jobs B wins, a 95% credible interval, and a direct probability that B beats A.",
    tex: [String.raw`p\mid k,n\ \sim\ \operatorname{Beta}(\alpha_0+k,\ \beta_0+n-k),\qquad P(B\succ A)=P\!\left(p>\tfrac12\right)`],
  },
  {
    n: "09",
    title: "Per-cluster breakdown with FDR control",
    q: "Where does each résumé pull ahead?",
    body: "The same test runs inside each of the 8 job clusters. Bonferroni and Benjamini\u2013Hochberg corrections keep significance honest across 8 simultaneous comparisons.",
    tex: [String.raw`\text{Bonferroni: }\alpha_{\text{adj}}=\tfrac{\alpha}{m},\qquad \text{BH: reject if }p_{(k)}\le\tfrac{k}{m}\,\alpha\quad(m=8)`],
  },
];

export default function HowItWorks() {
  const { t } = useTheme();
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "56px 28px 96px" }}>
      <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 18 }}>
        HOW IT WORKS
      </div>
      <h1 style={{ fontFamily: FF.display, fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.08, margin: "0 0 20px" }}>
        The math behind the verdict.
      </h1>
      <p style={{ fontSize: 16.5, lineHeight: 1.7, color: t.muted, maxWidth: 580, margin: "0 0 12px" }}>
        Every comparison runs the same nine-stage pipeline &mdash; the one a data scientist would use
        to call a real A/B test. Here&apos;s each stage, the question it answers, and the math.
      </p>

           <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            style={{
              background: "transparent",
              border: `1px solid var(--accent)`,
              borderRadius: 14,
              padding: "22px 24px",
              gridColumn: i === STEPS.length - 1 && STEPS.length % 2 === 1 ? "1 / -1" : "auto",
            }}
          >
            <div className="flex items-baseline" style={{ gap: 14 }}>
              <span style={{ fontFamily: FF.mono, fontSize: 13, color: ACC, fontWeight: 500 }}>{s.n}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ fontFamily: FF.display, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>{s.title}</h2>
                <p style={{ fontFamily: FF.mono, fontSize: 12.5, color: t.accentText, margin: "6px 0 0" }}>{s.q}</p>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: t.muted, margin: "12px 0 0" }}>{s.body}</p>
                {s.tex && (
                  <div style={{ color: t.text, marginTop: 4 }}>
                    {s.tex.map((x, i) => (
                      <Tex key={i} tex={x} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          background: "transparent",
          border: `1px solid var(--accent)`,
          borderRadius: 14,
          padding: "20px 22px",
        }}
      >
        <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 10 }}>
          WHAT THE SCORE MEASURES
        </div>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: t.muted, margin: 0 }}>
          Each job is scored against the résumé&apos;s best-matching section, not one
          averaged whole-document vector &mdash; so a deep specialist is judged on its
          strongest, most relevant experience instead of being diluted by breadth of
          vocabulary. One caveat remains: the eight job groups are K-means clusters, so a
          broad group like DevOps / SRE / Cloud mixes pure-infrastructure roles with cloud-
          and data-platform ones. A résumé can win the roles that truly match it while
          the cluster average still leans the other way. Read the per-cluster signs as
          directional over a mixed group, not as a recruiter&apos;s verdict on fit: the value
          here is the statistical rigour of comparing two versions against the same market,
          not a claim that cosine similarity equals hireability.
        </p>
      </div>

      <p style={{ fontSize: 13.5, color: t.faint, lineHeight: 1.6, marginTop: 28 }}>
        Pre-launch figures shown across the app are validated against a simulated cohort. Your
        résumés are read in memory to compute the scores and never stored.
      </p>
    </main>
  );
}
