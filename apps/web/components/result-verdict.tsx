"use client";

import type { CompareResponse } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { useEffect, useState } from "react";
import { ACC, A, B, FF, type ThemeTokens } from "@/lib/theme";
import { CONFIDENCE_DOTS, fmtP, fmtPct, fmtPts, relativeEdge, winRates } from "@/lib/format";

/** A|B win-share bar: red = A's share of jobs, green = B's. Reused on the home
 * page so both surfaces show the identical split. Grows on mount. */
export function WinShareBar({
  aWins,
  bWins,
  t,
  height = 34,
}: {
  aWins: number;
  bWins: number;
  t: ThemeTokens;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const aPct = Math.max(0, Math.min(100, aWins));
  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ fontFamily: FF.mono, fontSize: 10.5, letterSpacing: "0.06em", color: t.faint, marginBottom: 7 }}
      >
        <span style={{ color: A }}>◀ A {fmtPct(aWins)}</span>
        <span style={{ color: B }}>B {fmtPct(bWins)} ▶</span>
      </div>
      <div
        style={{
          position: "relative",
          height,
          borderRadius: 8,
          overflow: "hidden",
          background: `${B}22`,
          border: `1px solid ${t.border}`,
        }}
      >
        {/* A share grows from left */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${aPct}%`,
            background: A,
            opacity: 0.9,
            transformOrigin: "left center",
            transform: mounted ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 620ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        {/* B share fills the remainder */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${aPct}%`,
            right: 0,
            background: B,
            opacity: 0.9,
            transformOrigin: "right center",
            transform: mounted ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 620ms cubic-bezier(0.22,1,0.36,1) 80ms",
          }}
        />
        {/* divide */}
        <div
          style={{
            position: "absolute",
            left: `${aPct}%`,
            top: -1,
            bottom: -1,
            width: 2,
            background: t.bg,
            transform: "translateX(-1px)",
          }}
        />
      </div>
      <div style={{ fontFamily: FF.mono, fontSize: 10, color: t.faint, marginTop: 6, textAlign: "center", letterSpacing: "0.04em" }}>
        share of {" "}jobs each résumé wins
      </div>
    </div>
  );
}

function Stat({ label, value, t, color }: { label: string; value: string; t: ThemeTokens; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: FF.mono, fontSize: 10, color: t.faint, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: FF.mono, fontSize: 13, color: color ?? t.text, marginTop: 3, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

export function ResultVerdict({ data }: { data: CompareResponse }) {
  const { t } = useTheme();
  const { verdict, summary } = data;
  const { aWins, bWins } = winRates(summary);
  const isTie = verdict.winner === "tie";
  const winner = verdict.winner;
  const winColor = winner === "A" ? A : winner === "B" ? B : t.muted;
  const winRate = winner === "A" ? aWins : winner === "B" ? bWins : 50;
  const edge = isTie ? null : relativeEdge(summary, winner);
  const loser = winner === "A" ? "B" : "A";
  const [lo, hi] = verdict.ci_points;

  return (
    <div
      style={{
        position: "relative",
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 18,
        padding: "30px 32px 26px",
        boxShadow: t.cardShadow,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 16 }}>
        <span style={{ fontFamily: FF.mono, fontSize: 10.5, letterSpacing: "0.16em", color: t.faint }}>
          VERDICT
        </span>
        <span
          className="inline-flex items-center"
          style={{
            fontFamily: FF.mono,
            gap: 8,
            fontSize: 10.5,
            fontWeight: 500,
            color: t.accentText,
            border: `1px solid ${ACC}66`,
            borderRadius: 999,
            padding: "4px 11px",
          }}
        >
          <span style={{ color: t.text, letterSpacing: "0.15em" }}>{CONFIDENCE_DOTS[verdict.confidence]}</span>
          {verdict.confidence} confidence
        </span>
      </div>

      {isTie ? (
        <>
          <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 700, marginTop: 16, letterSpacing: "-0.02em" }}>
            No decisive winner
          </div>
          <p style={{ color: t.muted, marginTop: 10, maxWidth: 520, lineHeight: 1.6 }}>
            Across {summary.n_jobs.toLocaleString()} jobs the two résumés score within noise of each
            other — the confidence interval includes zero.
          </p>
          <div style={{ marginTop: 22 }}>
            <WinShareBar aWins={aWins} bWins={bWins} t={t} />
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: FF.display, fontSize: 24, fontWeight: 600, marginTop: 16, color: t.muted, letterSpacing: "-0.01em" }}>
            Résumé <span style={{ color: winColor, fontWeight: 700 }}>{winner}</span> is the stronger match
          </div>

          <div
            className="grid gap-7"
            style={{ marginTop: 18, gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center" }}
          >
            {/* left: hero win-rate + connected support */}
            <div>
              <span style={{ fontFamily: FF.display, fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", color: winColor }}>
                {fmtPct(winRate)}
              </span>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 10, lineHeight: 1.5 }}>
                of {summary.n_jobs.toLocaleString()} jobs beat Résumé {loser}
                {edge === null ? "" : <> · <span style={{ color: t.text }}>{fmtPct(edge)} higher</span> average match</>}
              </div>
            </div>
            {/* right: win-share split bar (the signature) */}
            <WinShareBar aWins={aWins} bWins={bWins} t={t} />
          </div>
        </>
      )}

      <div style={{ height: 1, background: t.border, margin: "24px 0 16px" }} />
      <div className="flex" style={{ gap: 30, flexWrap: "wrap" }}>
        <Stat label="Δ mean" value={`${fmtPts(verdict.mean_delta_points ?? 0, 2, true)} pts`} t={t} color={winColor} />
        {lo !== null && hi !== null && (
          <Stat label="95% CI" value={`[${fmtPts(lo)}, ${fmtPts(hi)}]`} t={t} />
        )}
        <Stat label="p-value" value={fmtP(verdict.p_value)} t={t} />
        <Stat label="Cohen's d" value={fmtPts(verdict.cohens_d ?? 0)} t={t} />
      </div>
    </div>
  );
}
