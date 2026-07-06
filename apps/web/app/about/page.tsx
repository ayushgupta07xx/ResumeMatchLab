"use client";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";

export default function AboutPage() {
  const { t } = useTheme();
  const para: React.CSSProperties = { fontSize: 16.5, lineHeight: 1.7, color: t.muted, margin: "0 0 20px" };
  return (
    <main style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "64px 28px 96px" }}>
        <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 18 }}>
          ABOUT
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            margin: "0 0 14px",
          }}
        >
          Two résumés, one measured answer.
        </h1>
        <div style={{ width: 46, height: 3, borderRadius: 2, background: "var(--accent)", opacity: 0.9, margin: "0 0 30px" }} />
        <p style={para}>
          Most résumé advice is taste dressed up as fact — a recruiter&apos;s hunch, a thread&apos;s
          hot take, a tool that scores you against a keyword list. None of it tells you whether one
          version of your résumé actually matches more real jobs than another.
        </p>
        <p style={para}>
          ResumeMatch Lab settles it with an experiment. It scores both versions against 9,014 live
          Indian tech jobs using semantic similarity — matching on what the work involves, not just
          shared words — then runs the full statistical pipeline: bootstrap confidence intervals,
          significance tests, variance reduction, and a cluster-by-cluster breakdown.
        </p>
        <p style={{ ...para, marginBottom: 40 }}>
          You get a verdict you can act on: which résumé wins, by how much, and exactly which job
          clusters each one pulls ahead in. Your résumés are read in memory to compute the scores and
          never stored.
        </p>
        <div
          style={{
            background: "transparent",
            border: `1px solid var(--accent)`,
            borderRadius: 16,
            padding: "22px 24px",
            boxShadow: "none",
          }}
        >
          <div style={{ fontFamily: FF.display, fontSize: 15, fontWeight: 700 }}>Built by Ayush Gupta</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: t.muted, margin: "8px 0 14px" }}>
            ResumeMatch Lab is designed, built, and maintained by Ayush Gupta — one developer who got
            tired of choosing between résumé versions by gut feel.
          </p>
          <div className="flex items-center" style={{ gap: 18 }}>
            <a
              href="https://github.com/ayushgupta07xx"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 14, fontWeight: 600, color: t.accentText, textDecoration: "none" }}
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/ayush-gupta-544a803a2"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 14, fontWeight: 600, color: t.accentText, textDecoration: "none" }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
