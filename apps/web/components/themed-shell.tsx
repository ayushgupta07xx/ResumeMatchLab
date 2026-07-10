"use client";

import type { ReactNode, CSSProperties } from "react";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";
import { Nav } from "@/components/nav";

export function ThemedShell({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  const vars: Record<string, string> = {
    "--accent": t.accent,
    "--accent-press": t.accentPress,
    "--accent-soft": t.accentSoft,
    "--accent-tint": t.accentTint,
    "--on-accent": t.onAccent,
  };
  return (
    <div
      style={
        {
          ...vars,
          position: "relative",
          isolation: "isolate",
          background: t.bgGradient,
          color: t.text,
          minHeight: "100dvh",
          fontFamily: FF.body,
          transition: "background .3s, color .3s",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: t.glow,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav />
        {children}
      </div>
    </div>
  );
}
