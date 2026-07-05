"use client";

import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";

export default function AboutPage() {
  const { t } = useTheme();

  const para: React.CSSProperties = { fontSize: 16.5, lineHeight: 1.7, color: t.muted, margin: "0 0 20px" };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 28px 96px" }}>
      <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 18 }}>
        ABOUT
      </div>
      <h1
        style={{
          fontFamily: FF.display,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
          margin: "0 0 28px",
        }}
      >
        Two resumes, one measured answer.
      </h1>

      <p style={para}>
        Most resume advice is taste dressed up as fact — a recruiter&apos;s hunch, a thread&apos;s
        hot take, a tool that scores you against a keyword list. None of it tells you whether one
        version of your resume actually matches more real jobs than another.
      </p>
      <p style={para}>
        ResumeMatch Lab settles it with an experiment. It scores both versions against 9,014 live
        Indian tech jobs using semantic similarity — matching on what the work involves, not just
        shared words — then runs the full statistical pipeline: bootstrap confidence intervals,
        significance tests, variance reduction, and a cluster-by-cluster breakdown.
      </p>
      <p style={{ ...para, marginBottom: 40 }}>
        You get a verdict you can act on: which resume wins, by how much, and exactly which job
        clusters each one pulls ahead in. Your resumes are read in memory to compute the scores and
        never stored.
      </p>

      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: "22px 24px",
          boxShadow: t.cardShadow,
        }}
      >
        <div style={{ fontFamily: FF.display, fontSize: 15, fontWeight: 700 }}>Built by Ayush Gupta</div>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: t.muted, margin: "8px 0 14px" }}>
          ResumeMatch Lab is designed, built, and maintained by Ayush Gupta — one developer who got
          tired of choosing between resume versions by gut feel.
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
    </main>
  );
}
