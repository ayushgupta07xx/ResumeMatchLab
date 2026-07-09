"use client";
import { Btn } from "@/components/btn";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useResults, useTheme } from "@/lib/providers";
import { A, B, FF } from "@/lib/theme";
import { fmtP, fmtPct, fmtPts } from "@/lib/format";
import { Download } from "lucide-react";
import { downloadReport } from "@/lib/report";
import { ResultVerdict } from "@/components/result-verdict";
import { ForestPlot } from "@/components/forest-plot";
import { ScoreDistribution } from "@/components/score-distribution";
import { PosteriorCurve } from "@/components/posterior-curve";
import { ClusterTable } from "@/components/cluster-table";

export default function ResultsPage() {
  const router = useRouter();
  const { t } = useTheme();
  const { result, names } = useResults();

  useEffect(() => {
    if (!result) router.replace("/compare");
  }, [result, router]);

  if (!result) return null;

  const { tests, effect, cuped, sequential } = result;
  const stats = [
    { k: tests.primary.name, v: `p ${fmtP(tests.primary.pvalue)}` },
    {
      k: "CUPED variance reduction",
      v: `${fmtPct((cuped.variance_reduction ?? 0) * 100, 1)} · ×${(cuped.effective_n_multiplier ?? 1).toFixed(2)} eff. N`,
    },
    { k: "mSPRT (always-valid)", v: `p ${fmtP(sequential.always_valid_p)}` },
    {
      k: "Power / required N",
      v: `${fmtPct((effect.achieved_power ?? 0) * 100, 0)} · N≥${Math.round(effect.required_n_80 ?? 0)}`,
    },
    { k: "Cohen's d", v: fmtPts(effect.cohens_d ?? 0) },
  ];

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 28px 80px", display: "grid", gap: 20 }}>
      <ResultVerdict data={result} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          background: "transparent",
          border: `1px solid var(--accent)`,
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 13, color: t.muted }}>
          {names ? (
            <>
              Résumés in comparison:{" "}
              <span style={{ color: A, fontWeight: 700 }}>A</span>{" "}
              <span style={{ color: t.text }}>({names.a})</span>{" "}
              <span style={{ color: t.faint }}>vs</span>{" "}
              <span style={{ color: B, fontWeight: 700 }}>B</span>{" "}
              <span style={{ color: t.text }}>({names.b})</span>
            </>
          ) : (
            "Comparison report"
          )}
        </div>
        <Btn
          variant="ghost"
          onClick={() => downloadReport(result, names)}
          style={{
            gap: 8,
            borderRadius: 10,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: FF.body,
          }}
        >
          <Download size={15} /> Download report (PDF)
        </Btn>
      </div>

      <div
        style={{
          display: "grid",
          border: `1px solid var(--accent)`,
          background: "transparent",
          borderRadius: 14,
          overflow: "hidden",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {stats.map((s, i) => (
          <div key={s.k} style={{ background: "transparent", padding: 16, borderRight: i === stats.length - 1 ? "none" : `1px solid var(--accent-soft)` }}>
            <div style={{ fontSize: 11.5, color: t.muted }}>{s.k}</div>
            <div style={{ fontFamily: FF.mono, fontSize: 13.5, fontWeight: 500, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <ForestPlot clusters={result.clusters} />

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <ScoreDistribution dist={result.distributions} />
        <PosteriorCurve bayes={result.bayes} />
      </div>

      <ClusterTable clusters={result.clusters} />

      <div>
        <Btn
          variant="ghost"
          href="/compare"
          style={{
            borderRadius: 11,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Compare another pair
        </Btn>
      </div>
    </main>
  );
}
