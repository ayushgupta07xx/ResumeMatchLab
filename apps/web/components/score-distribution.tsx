"use client";

import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Distributions } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { A, B, FF } from "@/lib/theme";

export function ScoreDistribution({ dist }: { dist: Distributions }) {
  const { t } = useTheme();
  const data = dist.bin_centers.map((c, i) => ({ score: c, a: dist.resume_a[i], b: dist.resume_b[i] }));

  return (
    <div style={{ background: "transparent", border: `1px solid var(--accent)`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
        Match-score distributions
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 0" }}>
        How each résumé&apos;s similarity scores spread across the corpus.
      </p>
      <div style={{ height: 250, width: "100%", marginTop: 14 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={A} stopOpacity={0.4} />
                <stop offset="100%" stopColor={A} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="fillB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={B} stopOpacity={0.4} />
                <stop offset="100%" stopColor={B} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="score"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => Number(v).toFixed(2)}
              tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }}
              stroke={t.border}
            />
            <YAxis tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }} stroke={t.border} />
            <Tooltip
              contentStyle={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: t.text,
                fontFamily: FF.mono,
              }}
              labelFormatter={(v) => `score ≈ ${Number(v).toFixed(3)}`}
            />
            <Area type="monotone" dataKey="a" name="Résumé A" stroke={A} fill="url(#fillA)" strokeWidth={1.5} isAnimationActive={false} />
            <Area type="monotone" dataKey="b" name="Résumé B" stroke={B} fill="url(#fillB)" strokeWidth={1.5} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center" style={{ gap: 24, fontSize: 12, color: t.muted, marginTop: 4 }}>
        <span className="flex items-center" style={{ gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: A, display: "inline-block" }} /> Résumé A
        </span>
        <span className="flex items-center" style={{ gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: B, display: "inline-block" }} /> Résumé B
        </span>
      </div>
    </div>
  );
}
