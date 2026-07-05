"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CompareResponse } from "@/lib/types";
import { THEME, type ThemeTokens } from "@/lib/theme";

type Mode = "dark" | "light";

const ThemeCtx = createContext<{ mode: Mode; t: ThemeTokens; toggle: () => void }>({
  mode: "dark",
  t: THEME.dark,
  toggle: () => {},
});

type ResumeNames = { a: string; b: string };

const ResultsCtx = createContext<{
  result: CompareResponse | null;
  setResult: (r: CompareResponse | null) => void;
  names: ResumeNames | null;
  setNames: (n: ResumeNames | null) => void;
}>({ result: null, setResult: () => {}, names: null, setNames: () => {} });

export function Providers({ children }: { children: ReactNode }) {
  // In-memory only (mirrors JobAtlas) — resets to dark on reload, never persisted.
  const [mode, setMode] = useState<Mode>("dark");
  // Resume-derived report is held in memory and never written to storage.
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [names, setNames] = useState<ResumeNames | null>(null);

  return (
    <ThemeCtx.Provider
      value={{ mode, t: THEME[mode], toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}
    >
      <ResultsCtx.Provider value={{ result, setResult, names, setNames }}>{children}</ResultsCtx.Provider>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
export const useResults = () => useContext(ResultsCtx);
