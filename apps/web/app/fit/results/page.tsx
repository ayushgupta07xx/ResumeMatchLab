"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useResults, useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";
import { Btn } from "@/components/btn";
import { FitBars } from "@/components/fit-bars";
import { FitDetail } from "@/components/fit-detail";
import type { FitClusterRow } from "@/lib/types";

const STRONGCOL = "#2ea043";

export default function FitResultsPage() {
  const router = useRouter();
  const { t } = useTheme();
  const { fitResult, fitName } = useResults();
  const [selected, setSelected] = useState<FitClusterRow | null>(null);
  const [ddHover, setDdHover] = useState(false);

  useEffect(() => {
    if (!fitResult) router.replace("/compare?mode=single");
  }, [fitResult, router]);

  if (!fitResult) return null;

  const { clusters, top_clusters, weak_clusters } = fitResult;
  // dropdown + "current selection" resolve against the live cluster objects
  const byFit = [...clusters].sort((a, b) => b.role_fit - a.role_fit);

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 28px 80px",
        display: "grid",
        gap: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: FF.mono,
            fontSize: 11,
            letterSpacing: "0.16em",
            color: t.accentText,
            marginBottom: 10,
          }}
        >
          MARKET FIT
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          How your résumé fits the market
        </h1>
        {fitName && (
          <p style={{ fontFamily: FF.mono, fontSize: 12, color: t.muted, margin: "10px 0 0" }}>
            Scored: {fitName}
          </p>
        )}
      </div>

      {/* Summary */}
      <div
        style={{
          border: `1px solid var(--accent)`,
          borderRadius: 16,
          padding: "18px 22px",
        }}
      >
        <h3
          style={{
            fontFamily: FF.display,
            fontSize: 15,
            fontWeight: 700,
            margin: "0 0 12px",
            letterSpacing: "-0.01em",
          }}
        >
          Summary
        </h3>
        <div style={{ display: "grid", gap: 9, fontSize: 13.5, color: t.text, lineHeight: 1.5 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color: STRONGCOL, marginTop: 1 }}>▲</span>
            <span>
              <span style={{ color: t.muted }}>Strongest roles: </span>
              {top_clusters.join(", ")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color: t.faint, marginTop: 1 }}>▽</span>
            <span>
              <span style={{ color: t.muted }}>Weakest roles: </span>
              {weak_clusters.join(", ")}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: t.faint, margin: "14px 0 0", lineHeight: 1.5 }}>
          The bars below rank how strongly the résumé leans toward each role across the whole
          market. Open a role — from the dropdown or by clicking its bar — for its Role Fit Score and
          skill gaps. Percentiles are relative to the corpus&apos;s own spread, not an absolute
          quality grade.
        </p>
      </div>

      {/* role selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: FF.mono, fontSize: 12, color: t.muted }}>Deep-dive a role:</span>
        <div style={{ position: "relative", display: "inline-flex" }}>
          <select
            value={selected ? selected.cluster_id : ""}
            onMouseEnter={() => setDdHover(true)}
            onMouseLeave={() => setDdHover(false)}
            onChange={(e) => {
              const id = e.target.value;
              setSelected(
                id === "" ? null : clusters.find((c) => String(c.cluster_id) === id) ?? null,
              );
            }}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              fontFamily: FF.body,
              fontSize: 13,
              color: ddHover ? t.bg : t.text,
              background: ddHover ? "var(--accent)" : "transparent",
              border: `1px solid var(--accent)`,
              borderRadius: 9,
              padding: "8px 34px 8px 12px",
              cursor: "pointer",
              minWidth: 260,
              outline: "none",
              transition: "all 160ms ease",
            }}
          >
            <option value="" style={{ background: t.surface, color: t.text }}>
              — all roles (overview) —
            </option>
            {byFit.map((c) => (
              <option
                key={c.cluster_id}
                value={c.cluster_id}
                style={{ background: t.surface, color: t.text }}
              >
                {c.label} · {Math.round(c.role_fit)}/100
              </option>
            ))}
          </select>
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: ddHover ? t.bg : t.muted,
              fontSize: 10,
              transition: "color 160ms ease",
            }}
          >
            {"\u25BE"}
          </span>
        </div>
      </div>

      {selected ? (
        <FitDetail row={selected} onBack={() => setSelected(null)} />
      ) : (
        <FitBars clusters={clusters} onSelect={setSelected} />
      )}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Btn
          variant="ghost"
          href="/compare?mode=single"
          style={{
            gap: 8,
            fontFamily: FF.mono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "7px 15px",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{"\u2190"}</span> score another résumé
        </Btn>
      </div>
    </main>
  );
}
