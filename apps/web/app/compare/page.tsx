"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { compareFiles, compareText, fitFile, fitText } from "@/lib/api";
import { DEMO_A, DEMO_B, DEMO_NAMES } from "@/lib/demo";
import { useResults, useTheme } from "@/lib/providers";
import { ACC, A, B, FF } from "@/lib/theme";
import { UploadZone } from "@/components/upload-zone";
import { Btn } from "@/components/btn";

type Mode = "two" | "single";

export default function ComparePage() {
  const router = useRouter();
  const { t } = useTheme();
  const { setResult, setNames, setFitResult, setFitName } = useResults();

  const [mode, setMode] = useState<Mode>("two");
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [single, setSingle] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "single") {
      setMode("single");
    }
  }, []);

  const ready = mode === "two" ? !!a && !!b && !loading : !!single && !loading;

  async function runDemo() {
    setError(null);
    setDemoLoading(true);
    try {
      if (mode === "two") {
        const data = await compareText(DEMO_A, DEMO_B);
        setNames(DEMO_NAMES);
        setResult(data);
        router.push("/results");
      } else {
        const data = await fitText(DEMO_A);
        setFitName("Demo résumé");
        setFitResult(data);
        router.push("/fit/results");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo failed. Try again.");
      setDemoLoading(false);
    }
  }

  async function run() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "two") {
        if (!a || !b) return;
        const data = await compareFiles(a, b);
        setNames({ a: a.name, b: b.name });
        setResult(data);
        router.push("/results");
      } else {
        if (!single) return;
        const data = await fitFile(single);
        setFitName(single.name);
        setFitResult(data);
        router.push("/fit/results");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  const modeSeg = (m: Mode, label: string) => (
    <button
      onClick={() => {
        if (!loading) setMode(m);
      }}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "none",
        cursor: loading ? "default" : "pointer",
        fontFamily: FF.body,
        fontSize: 13,
        fontWeight: 600,
        background: mode === m ? "var(--accent)" : "transparent",
        color: mode === m ? "var(--on-accent)" : t.muted,
        transition: "background .14s, color .14s",
      }}
    >
      {label}
    </button>
  );

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "24px 28px 28px" }}>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 3,
            background: "var(--accent-soft)",
            borderRadius: 11,
          }}
        >
          {modeSeg("two", "Two résumés")}
          {modeSeg("single", "Single résumé")}
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "20px 0 22px" }}>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.12,
          }}
        >
          {mode === "two"
            ? "Compare two résumé versions"
            : "Score one résumé against the market"}
        </h1>
        <p style={{ fontSize: 14, color: t.muted, margin: "10px auto 0", maxWidth: 620 }}>
          {mode === "two"
            ? "Upload both versions to see which scores better across the corpus."
            : "Upload one résumé to see which job clusters it leans toward, ranked by match strength."}
        </p>

        <Btn
          variant="ghost"
          onClick={runDemo}
          disabled={demoLoading}
          style={{
            gap: 10,
            marginTop: 16,
            padding: "13px 28px",
            fontFamily: FF.display,
            fontSize: 15.5,
            fontWeight: 700,
          }}
        >
          {demoLoading ? <Loader2 size={17} className="spin" /> : "Try a demo"}
          {!demoLoading && <ArrowRight size={17} strokeWidth={2.4} />}
          <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.62 }}>(no upload)</span>
        </Btn>
      </div>

      {mode === "two" ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          className="max-[680px]:!grid-cols-1"
        >
          <UploadZone side="A" color={A} file={a} onChange={setA} />
          <UploadZone side="B" color={B} file={b} onChange={setB} />
        </div>
      ) : (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <UploadZone
            side="A"
            color={ACC}
            file={single}
            onChange={setSingle}
            label="Your résumé"
            badge=""
          />
        </div>
      )}

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

      <div className="flex flex-col items-center" style={{ marginTop: 22, gap: 12 }}>
        <Btn
          variant="ghost"
          onClick={run}
          disabled={!ready}
          style={{
            gap: 9,
            fontWeight: 600,
            fontSize: 16,
            padding: "14px 30px",
            borderRadius: 12,
            fontFamily: FF.display,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="spin" /> Scoring against the corpus…
            </>
          ) : mode === "two" ? (
            "Compare"
          ) : (
            "Score against the market"
          )}
        </Btn>
        <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: t.faint }}>
          {loading
            ? "First run wakes the API — this can take ~20–30s"
            : "Processed in your session · never stored"}
        </span>
      </div>
    </main>
  );
}
