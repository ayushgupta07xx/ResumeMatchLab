"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/providers";
import { ACC, ACC_PRESS, FF } from "@/lib/theme";
import { ExampleVerdict } from "@/components/example-verdict";

function GithubMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Landing() {
  const { t } = useTheme();

  return (
    <>
      {/* hero — two columns: thesis left, verdict right */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -140,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1100,
            height: 560,
            pointerEvents: "none",
            background: t.glow,
          }}
        />
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "72px 28px 76px" }}>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* left: thesis */}
            <div className="rise">
              <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText }}>
                RESUME A/B TESTING
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
                Which resume wins?
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
                    boxShadow: `0 2px 0 ${ACC_PRESS}, 0 10px 30px ${ACC}3d`,
                  }}
                >
                  Compare resumes <ArrowRight size={17} />
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

      {/* trust */}
      <section style={{ borderTop: `1px solid ${t.border}`, background: t.bg2 }}>
        <div
          className="flex items-center justify-center"
          style={{ gap: 40, maxWidth: 1180, margin: "0 auto", padding: "22px 28px", flexWrap: "wrap" }}
        >
          {["Never stored", "Free", "Open source"].map((x) => (
            <span key={x} style={{ fontFamily: FF.mono, fontSize: 12.5, color: t.muted, letterSpacing: "0.02em" }}>
              {x}
            </span>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 28px 46px" }}>
        <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <a
            href="https://github.com/ayushgupta07xx"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: t.faint, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}
          >
            <GithubMark size={14} /> Built by Ayush Gupta
          </a>
          <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: t.faint }}>
            Processed in-memory · never leaves your session
          </span>
        </div>
      </footer>
    </>
  );
}
