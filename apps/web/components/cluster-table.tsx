"use client";
import React from "react";

import type { ClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { ACC, A, B, FF } from "@/lib/theme";
import { fmtP, fmtPts } from "@/lib/format";

export function ClusterTable({ clusters }: { clusters: ClusterRow[] }) {
  const { t } = useTheme();
  const rows = [...clusters].sort((a, b) => (b.mean_delta ?? 0) - (a.mean_delta ?? 0));

  const th: React.CSSProperties = {
    fontFamily: FF.body,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: t.faint,
    fontWeight: 600,
    padding: "0 0 10px",
    textAlign: "left",
  };
  const td: React.CSSProperties = { fontFamily: FF.mono, fontSize: 12.5, padding: "10px 0", borderTop: `1px solid ${t.border}` };

  return (
    <div style={{ background: "transparent", border: `1px solid var(--accent)`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
        Per-cluster breakdown
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 14px" }}>
        Δ is B − A in percentage points. Significance uses Benjamini–Hochberg FDR across the 9 clusters.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Cluster</th>
              <th style={{ ...th, textAlign: "right" }}>n</th>
              <th style={{ ...th, textAlign: "right" }}>Δ pts</th>
              <th style={{ ...th, textAlign: "right" }}>95% CI</th>
              <th style={{ ...th, textAlign: "right" }}>p (BH)</th>
              <th style={{ ...th, textAlign: "center" }}>Winner</th>
              <th style={th}>Significant</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const wc = c.winner === "A" ? A : c.winner === "B" ? B : t.muted;
              return (
                <tr key={c.cluster_id}>
                  <td style={{ ...td, fontFamily: FF.body, color: t.text }}>{c.label}</td>
                  <td style={{ ...td, textAlign: "right", color: t.muted }}>{c.n.toLocaleString()}</td>
                  <td style={{ ...td, textAlign: "right", color: t.text }}>{fmtPts((c.mean_delta ?? 0) * 100, 2, true)}</td>
                  <td style={{ ...td, textAlign: "right", color: t.muted }}>
                    [{fmtPts((c.ci_low ?? 0) * 100)}, {fmtPts((c.ci_high ?? 0) * 100)}]
                  </td>
                  <td style={{ ...td, textAlign: "right", color: t.muted }}>{fmtP(c.p_bh_fdr)}</td>
                  <td style={{ ...td, textAlign: "center", color: wc, fontWeight: 700 }}>
                    {c.winner === "tie" ? "tie" : c.winner}
                  </td>
                  <td style={td}>
                    {c.sig_bh ? (
                      <span
                        style={{
                          fontFamily: FF.body,
                          fontSize: 11,
                          color: t.accentText,
                          border: `1px solid ${ACC}66`,
                          borderRadius: 999,
                          padding: "2px 9px",
                        }}
                      >
                        significant
                      </span>
                    ) : (
                      <span style={{ color: t.faint }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
