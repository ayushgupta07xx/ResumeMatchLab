"use client";

import {
  Bar,
  BarChart,
  Cell,
  ErrorBar,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { A, B, FF } from "@/lib/theme";

function Card({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { t } = useTheme();
  return (
    <div style={{ background: "transparent", border: `1px solid var(--accent)`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: t.muted, margin: "6px 0 0" }}>{subtitle}</p>
      {children}
    </div>
  );
}

export function ForestPlot({ clusters }: { clusters: ClusterRow[] }) {
  const { t } = useTheme();
  const rows = [...clusters]
    .filter((c) => c.mean_delta !== null)
    .sort((a, b) => (a.mean_delta ?? 0) - (b.mean_delta ?? 0))
    .map((c) => {
      const x = (c.mean_delta ?? 0) * 100;
      const lo = (c.ci_low ?? 0) * 100;
      const hi = (c.ci_high ?? 0) * 100;
      const color = c.winner === "A" ? A : c.winner === "B" ? B : t.faint;
      return { label: c.label, x, err: [x - lo, hi - x] as [number, number], color };
    });

  return (
    <Card
      title="Where each résumé matches better — by job cluster"
      subtitle="Average score gap per cluster (percentage points), with 95% bootstrap intervals."
    >
      <div style={{ height: 360, width: "100%", marginTop: 14 }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 28, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: t.muted, fontFamily: FF.mono }}
              tickFormatter={(v: any) => v.toFixed(0)}
              stroke={t.border}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={156}
              tick={{ fontSize: 12, fill: t.text }}
              stroke={t.border}
            />
            <ReferenceLine x={0} stroke={t.faint} strokeDasharray="3 3" />
            <Tooltip
              cursor={{ fill: t.surface2, opacity: 0.5 }}
              contentStyle={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                fontSize: 12,
                color: t.text,
                fontFamily: FF.mono,
              }}
              labelStyle={{ color: t.text }}
              itemStyle={{ color: t.text }}
              formatter={(v: any) => [`${v.toFixed(2)} pts`, "Δ (B − A)"]}
            />
            <Bar dataKey="x" radius={2} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
              <ErrorBar dataKey="err" direction="x" width={4} strokeWidth={1.2} stroke={t.faint} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div
        className="flex items-center justify-between"
        style={{ fontFamily: FF.mono, fontSize: 10, color: t.faint, marginTop: 6, letterSpacing: "0.04em" }}
      >
        <span>{"\u25C0"} Résumé A matches better</span>
        <span>Résumé B matches better {"\u25B6"}</span>
      </div>
    </Card>
  );
}
