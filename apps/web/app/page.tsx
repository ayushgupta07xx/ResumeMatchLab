"use client";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";
import { Btn } from "@/components/btn";
import { ResultVerdict } from "@/components/result-verdict";
import { DEMO_RESULT } from "@/lib/demo-result";
export default function Landing() {
  const { t } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 69px)" }}>
      {/* hero — two columns: thesis left, verdict right */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "72px 28px 76px" }}>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* left: thesis */}
            <div className="rise">
              <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText }}>
                RÉSUMÉ A/B TESTING · MARKET FIT
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
              <p style={{ fontSize: 18, lineHeight: 1.6, color: t.muted, maxWidth: 460, margin: "22px 0 0" }}>
                Compare two versions head-to-head, or score one résumé against the market. Real jobs,
                one measured answer.
              </p>
              <div className="flex items-center" style={{ gap: 14, marginTop: 34, flexWrap: "wrap" }}>
                <Btn
                  variant="filled"
                  href="/compare"
                  style={{
                    gap: 8,
                    fontFamily: FF.display,
                    fontWeight: 600,
                    fontSize: 15.5,
                    padding: "14px 24px",
                    borderRadius: 11,
                  }}
                >
                  Compare résumés <ArrowRight size={17} />
                </Btn>
                <Btn
                  variant="ghost"
                  href="/compare?mode=single"
                  style={{
                    fontFamily: FF.display,
                    fontWeight: 600,
                    fontSize: 15.5,
                    padding: "14px 24px",
                    borderRadius: 11,
                  }}
                >
                  Score one résumé
                </Btn>
                <Btn
                  variant="ghost"
                  borderless
                  href="/how-it-works"
                  style={{
                    fontFamily: FF.display,
                    fontWeight: 600,
                    fontSize: 15,
                    padding: "14px 12px",
                  }}
                >
                  Methodology
                </Btn>
              </div>
            </div>
            {/* right: verdict signature */}
            <div className="rise3">
              <ResultVerdict data={DEMO_RESULT} />
            </div>
          </div>
        </div>
      </header>

      {/* spacer — hero owns the screen, footer sits at the bottom */}
      <div style={{ flex: 1 }} />

      {/* footer */}
      <footer style={{ borderTop: `1px solid ${t.border}` }}>
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
    </div>
  );
}
