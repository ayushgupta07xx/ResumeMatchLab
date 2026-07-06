"use client";

import type { CompareResponse } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { ACC, A, B, FF } from "@/lib/theme";
import { CONFIDENCE_DOTS, fmtP, fmtPct, fmtPts, relativeEdge, winRates } from "@/lib/format";

export function ResultVerdict({ data }: { data: CompareResponse }) {
  const { t } = useTheme();
  const { verdict, summary } = data;
  const { aWins, bWins } = winRates(summary);
  const isTie = verdict.winner === "tie";
  const winner = verdict.winner;
  const winColor = winner === "A" ? A : winner === "B" ? B : t.muted;
  const winRate = winner === "A" ? aWins : winner === "B" ? bWins : 50;
  const edge = isTie ? null : relativeEdge(summary, winner);
  const [lo, hi] = verdict.ci_points;

  return (
    <div
      style={{
        position: "relative",
        background: "transparent",
        border: "1px solid var(--accent)",
        borderRadius: 18,
        padding: "30px 32px 26px",
        boxShadow: "none",
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
        </>
      ) : (
        <>
          <div style={{ fontFamily: FF.display, fontSize: 24, fontWeight: 600, marginTop: 16, color: t.muted, letterSpacing: "-0.01em" }}>
            Résumé <span style={{ color: winColor, fontWeight: 700 }}>{winner}</span> is the stronger match
          </div>
          <div className="flex items-end" style={{ gap: 28, marginTop: 14, flexWrap: "wrap" }}>
            <div>
              <div className="flex items-end" style={{ gap: 8 }}>
                <span style={{ fontFamily: FF.display, fontSize: 56, fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
                  {fmtPct(winRate)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>
                of {summary.n_jobs.toLocaleString()} jobs it out-scores Résumé {winner === "A" ? "B" : "A"}
              </div>
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontFamily: FF.display, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {edge === null ? "—" : `${fmtPct(edge)} higher`}
              </div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 6 }}>average match score</div>
            </div>
          </div>
        </>
      )}

      <div style={{ height: 1, background: t.border, margin: "22px 0 14px" }} />
      <div style={{ fontFamily: FF.mono, fontSize: 12, color: t.faint, letterSpacing: "0.01em" }}>
        Δ {fmtPts(verdict.mean_delta_points ?? 0, 2, true)} pts
        {lo !== null && hi !== null ? `   95% CI [${fmtPts(lo)}, ${fmtPts(hi)}]` : ""}
        {"   p "}
        {fmtP(verdict.p_value)}
        {"   d "}
        {fmtPts(verdict.cohens_d ?? 0)}
      </div>
    </div>
  );
}
