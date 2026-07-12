"use client";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useTheme } from "@/lib/providers";
import { FF, type ThemeTokens } from "@/lib/theme";

const STATS = [
  { n: "9,014", label: "Real Indian tech jobs scored" },
  { n: "9", label: "Role clusters analyzed" },
  { n: "6", label: "Statistical methods per verdict" },
];

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.28 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function LinkButton({ href, icon, label, t }: { href: string; icon: React.ReactNode; label: string; t: ThemeTokens }) {
  const [h, setH] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        borderRadius: 10,
        padding: "9px 16px",
        border: `1px solid var(--accent)`,
        background: h ? "var(--accent)" : "transparent",
        color: h ? t.onAccent : t.text,
        transition: "background 160ms ease, color 160ms ease",
      }}
    >
      {icon}
      {label}
    </a>
  );
}

function StatCard({ n, label, t }: { n: string; label: string; t: ThemeTokens }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        border: `1px solid var(--accent)`,
        borderRadius: 14,
        padding: "22px 24px",
        background: h ? "var(--accent)" : "transparent",
        transition: "background 160ms ease, color 160ms ease",
      }}
    >
      <div
        style={{
          fontFamily: FF.display,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: h ? t.onAccent : t.text,
          transition: "color 160ms ease",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 13.5, marginTop: 4, color: h ? t.onAccent : t.muted, transition: "color 160ms ease" }}>
        {label}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTheme();

  return (
    <main style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", width: "100%", padding: "56px 28px 40px" }}>
        <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 20 }}>
          ABOUT
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            margin: "0 0 24px",
            maxWidth: 560,
          }}
        >
          Proof, not opinion, on which r&eacute;sum&eacute; wins.
        </h1>

        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            flexWrap: "wrap",
            margin: "0 0 40px",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 280,
              fontSize: 16.5,
              lineHeight: 1.75,
              color: t.muted,
            }}
          >
            <p style={{ margin: 0 }}>
              ResumeMatch Lab scores two versions of a r&eacute;sum&eacute; against 9,014 live Indian
              tech jobs by semantic similarity &mdash; matching on what the work actually involves,
              not shared keywords &mdash; then runs a full statistical pipeline to say which version
              matches the market better, and where.
            </p>
            <p style={{ margin: "16px 0 0" }}>
              It breaks the verdict down cluster by cluster with confidence intervals and effect
              sizes, and can also score a single r&eacute;sum&eacute; on its own &mdash; a percentile
              fit against the market. R&eacute;sum&eacute;s are read in memory and never stored, and
              it is built and maintained by{" "}
              <span style={{ color: t.text, fontWeight: 700 }}>Ayush Gupta</span>.
            </p>
          </div>
          <div
            style={{
              flex: "0 0 500px",
              maxWidth: "100%",
              minWidth: 280,
              position: "relative",
              border: `1px solid var(--accent)`,
              borderRadius: 18,
              overflow: "hidden",
              background: t.surface2,
              aspectRatio: "16 / 9",
            }}
          >
            <img
              src="/demo.gif"
              alt=""
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {STATS.map((s) => (
            <StatCard key={s.label} n={s.n} label={s.label} t={t} />
          ))}
        </div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <LinkButton href="https://github.com/ayushgupta07xx" icon={<GithubIcon />} label="GitHub" t={t} />
          <LinkButton href="https://linkedin.com/in/ayush-gupta-544a803a2" icon={<LinkedinIcon />} label="LinkedIn" t={t} />
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${t.border}` }}>
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 28px", flexWrap: "wrap", gap: 12, fontFamily: FF.mono, fontSize: 12, color: t.faint }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Logo size={15} />
            ResumeMatch Lab
          </span>
          <span>&copy; 2026 &middot; Processed in-memory &middot; Never stored</span>
        </div>
      </footer>
    </main>
  );
}
