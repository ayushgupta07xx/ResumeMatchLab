"use client";

import type { FitClusterRow } from "@/lib/types";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";
import { Btn } from "@/components/btn";
import { Chips } from "@/components/forest-plot";

const STRONG = "#2ea043";
const MID = "#bb8009";

function scoreColor(v: number, faint: string): string {
  return v >= 66 ? STRONG : v >= 33 ? MID : faint;
}

const SECTION_LABELS: Record<string, string> = {
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
};

export function FitDetail({ row, onBack }: { row: FitClusterRow; onBack: () => void }) {
  const { t } = useTheme();
  const matchedSkills = row.matched_skills ?? [];
  const missingSkills = row.missing_skills ?? [];
  const coverage = row.coverage ?? { skills_ratio: null, quantified: 0, sections: {} };
  const sections = coverage.sections ?? {};
  const nMatched = matchedSkills.length;
  const nTotal = nMatched + missingSkills.length;
  const lowSignal = nTotal < 3; // too few common skills clear the floor to trust coverage
  const pct = coverage.skills_ratio != null ? Math.round(coverage.skills_ratio * 100) : null;

  return (
    <div style={{ animation: "fadeIn 220ms ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>

      <Btn
        variant="ghost"
        onClick={onBack}
        style={{
          gap: 8,
          marginBottom: 16,
          fontFamily: FF.mono,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "7px 15px",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{"\u2190"}</span> back to all roles
      </Btn>

      <div
        style={{
          background: "transparent",
          border: `1px solid var(--accent)`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        {/* header: role + Role Fit Score */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                color: t.muted,
                marginBottom: 6,
              }}
            >
              ROLE FIT SCORE
            </div>
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: t.text,
              }}
            >
              {row.label}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontFamily: FF.display,
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1,
                color: scoreColor(row.role_fit, t.faint),
              }}
            >
              {Math.round(row.role_fit)}
            </span>
            <span style={{ fontFamily: FF.mono, fontSize: 13, color: t.muted }}> / 100</span>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, margin: "12px 0 0", lineHeight: 1.5 }}>
          How closely this résumé resembles real {row.label} postings, ranked against every job in
          the corpus. Not a hireability grade — the diagnostics below are separate from the score.
        </p>

        {/* coverage line */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: `1px solid var(--accent-soft)`,
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            fontFamily: FF.mono,
            fontSize: 12.5,
            color: t.text,
          }}
        >
          <span>
            <span style={{ color: t.muted }}>Skill coverage: </span>
            {lowSignal ? (
              <span style={{ color: MID }}>
                low signal — only {nTotal} common skill{nTotal === 1 ? "" : "s"} in this role&apos;s
                postings
              </span>
            ) : pct != null ? (
              <>
                {pct}%{" "}
                <span style={{ color: t.muted }}>
                  ({nMatched} of {nTotal} key skills)
                </span>
              </>
            ) : (
              <span style={{ color: t.muted }}>no key skills identified for this role</span>
            )}
          </span>
          <span>
            <span style={{ color: t.muted }}>Quantified metrics: </span>
            {coverage.quantified}
          </span>
        </div>

        {/* sections — detected signals, soft on absence */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(sections).map(([key, present]) => (
            <span
              key={key}
              title={present ? "Detected" : "Not detected — check formatting"}
              style={{
                fontFamily: FF.mono,
                fontSize: 11,
                padding: "3px 9px",
                borderRadius: 999,
                border: `1px solid ${present ? "var(--accent)" : "var(--accent-soft)"}`,
                color: present ? t.text : t.faint,
              }}
            >
              {present ? "✓ " : "· "}
              {SECTION_LABELS[key] ?? key}
            </span>
          ))}
        </div>

        {/* matched / missing chips */}
        <div
          className="max-[560px]:!grid-cols-1"
          style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          <div>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 11,
                letterSpacing: "0.06em",
                color: t.muted,
                marginBottom: 8,
              }}
            >
              MATCHED — you have these, this role wants them
            </div>
            <Chips
              items={matchedSkills}
              color={STRONG}
              t={t}
              empty="none of this role's common skills detected yet"
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 11,
                letterSpacing: "0.06em",
                color: t.muted,
                marginBottom: 8,
              }}
            >
              COMMON IN THIS ROLE, NOT IN YOUR RÉSUMÉ
            </div>
            <Chips
              items={missingSkills}
              color={MID}
              t={t}
              empty="you already cover this role's common skills"
            />
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: t.faint, margin: "16px 0 0", lineHeight: 1.5 }}>
          Percentages are how often each skill appears in this role&apos;s postings. Descriptive, not
          a checklist — relevance depends on the specific job.
        </p>
      </div>
    </div>
  );
}
