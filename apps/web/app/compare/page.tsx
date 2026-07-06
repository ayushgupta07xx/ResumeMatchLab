"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { compareFiles } from "@/lib/api";
import { useResults, useTheme } from "@/lib/providers";
import { ACC, A, B, FF } from "@/lib/theme";
import { UploadZone } from "@/components/upload-zone";

export default function ComparePage() {
  const router = useRouter();
  const { t } = useTheme();
  const { setResult, setNames } = useResults();
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = !!a && !!b && !loading;

  async function run() {
    if (!a || !b) return;
    setError(null);
    setLoading(true);
    try {
      const data = await compareFiles(a, b);
      setNames({ a: a.name, b: b.name });
      setResult(data);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "64px 28px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{ fontFamily: FF.mono, fontSize: 11, letterSpacing: "0.16em", color: t.accentText, marginBottom: 14 }}>
          UPLOAD
        </div>
        <h1 style={{ fontFamily: FF.display, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          Add both versions
        </h1>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        className="max-[680px]:!grid-cols-1"
      >
        <UploadZone side="A" color={A} file={a} onChange={setA} />
        <UploadZone side="B" color={B} file={b} onChange={setB} />
      </div>

      {error && (
        <p
          style={{
            marginTop: 22,
            borderRadius: 10,
            border: "1px solid rgba(217,160,60,.4)",
            background: "rgba(217,160,60,.12)",
            color: t.text,
            padding: "12px 16px",
            fontSize: 13.5,
          }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-col items-center" style={{ marginTop: 36, gap: 14 }}>
        <button
          onClick={run}
          disabled={!ready}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            cursor: ready ? "pointer" : "default",
            background: ready ? ACC : "transparent",
            color: ready ? "var(--on-accent)" : t.faint,
            fontWeight: 600,
            fontSize: 16,
            padding: "14px 30px",
            borderRadius: 12,
            fontFamily: FF.display,
            border: ready ? "none" : "1px solid var(--accent)",
            boxShadow: ready ? "0 8px 24px var(--accent-soft)" : "none",
            opacity: loading ? 0.85 : 1,
            transition: "transform .12s, box-shadow .2s, opacity .2s",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="spin" /> Scoring against 9,014 jobs…
            </>
          ) : (
            "Compare"
          )}
        </button>
        <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: t.faint }}>
          {loading ? "First run wakes the API — this can take ~20–30s" : "Processed in your session · never stored"}
        </span>
      </div>
    </main>
  );
}
