"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Bayes } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { ACC, FF } from "@/lib/theme";
import { fmtPct } from "@/lib/format";

export function PosteriorCurve({ bayes }: { bayes: Bayes }) {
  const { t } = useTheme();
  const data = bayes.posterior_curve.map((d) => ({ p: d.p, density: d.density }));
  const [lo, hi] = bayes.credible_interval;
  const pBeats = (bayes.prob_b_beats_a ?? 0) * 100;

  return (
    <div style={{ background: "transparent", border: `1px solid var(--accent)`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
        Bayesian posterior — share of jobs B wins
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 0" }}>
        Probability B wins more than half the jobs:{" "}
        <span style={{ fontFamily: FF.mono, color: t.text }}>{fmtPct(pBeats)}</span>.
      </p>
      <div style={{ height: 230, width: "100%", marginTop: 14 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="fillPost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACC} stopOpacity={0.5} />
                <stop offset="100%" stopColor={ACC} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="p"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: any) => v.toFixed(2)}
              tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }}
              stroke={t.border}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: t.text,
                fontFamily: FF.mono,
              }}
              labelFormatter={(v: any) => `p = ${v.toFixed(3)}`}
              formatter={(v: any) => [v.toFixed(2), "density"]}
            />
            <ReferenceLine x={0.5} stroke={t.faint} strokeDasharray="3 3" />
            {lo !== null && <ReferenceLine x={lo} stroke={t.accent} strokeDasharray="2 2" />}
            {hi !== null && <ReferenceLine x={hi} stroke={t.accent} strokeDasharray="2 2" />}
            <Area type="monotone" dataKey="density" stroke={t.accent} fill="url(#fillPost)" strokeWidth={1.6} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: 11, color: t.faint, textAlign: "center", marginTop: 4 }}>
        Petrol dashes mark the 95% credible interval; gray line is the p = 0.50 tie point.
      </p>
    </div>
  );
}
