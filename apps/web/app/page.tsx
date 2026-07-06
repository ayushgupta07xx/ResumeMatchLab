"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/providers";
import { ACC, FF } from "@/lib/theme";
import { ExampleVerdict } from "@/components/example-verdict";
export default function Landing() {
  const { t } = useTheme();
  return (
    <>
      {/* hero — two columns: thesis left, verdict right */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "72px 28px 76px" }}>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* left: thesis */}
            <div className="rise">
              <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText }}>
                RÉSUMÉ A/B TESTING
              </div>
              <h1
                style={{
                  fontFamily: FF.display,
                  fontSize: 54,
                  lineHeight: 1.04,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  margin: "22px 0 0",
                }}
              >
                Which résumé wins?
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: t.muted, maxWidth: 440, margin: "22px 0 0" }}>
                Two versions. 9,014 real jobs. One measured answer.
              </p>
              <div className="flex items-center" style={{ gap: 18, marginTop: 34 }}>
                <Link
                  href="/compare"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: ACC,
                    color: "var(--on-accent)",
                    fontFamily: FF.display,
                    fontWeight: 600,
                    fontSize: 15.5,
                    padding: "14px 24px",
                    borderRadius: 11,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px var(--accent-soft)",
                  }}
                >
                  Compare résumés <ArrowRight size={17} />
                </Link>
                <Link
                  href="/how-it-works"
                  style={{ fontFamily: FF.display, fontWeight: 600, fontSize: 15, color: t.accentText, textDecoration: "none" }}
                >
                  How it works
                </Link>
              </div>
            </div>
            {/* right: verdict signature */}
            <div className="rise3">
              <ExampleVerdict />
            </div>
          </div>
        </div>
      </header>
      {/* footer */}
      <footer style={{ borderTop: `1px solid ${t.border}`, marginTop: 8 }}>
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 28px 40px", flexWrap: "wrap", gap: 12 }}
        >
          <a
            href="https://github.com/ayushgupta07xx"
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: FF.mono, fontSize: 12, color: t.faint, textDecoration: "none", letterSpacing: "0.02em" }}
          >
            Open source
          </a>
          <span style={{ fontFamily: FF.mono, fontSize: 12, color: t.faint, letterSpacing: "0.02em" }}>
            Processed in-memory {"\u00B7"} Never stored
          </span>
        </div>
      </footer>
    </>
  );
}
