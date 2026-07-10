// Re-themed to Graphite (monochrome + ambient glow).
// The accent flips per mode (near-white on dark, near-black on light), so it is
// delivered as CSS variables set on the themed root in ThemedShell. Components read
// ACC = var(--accent); translucent + on-accent variants read the matching vars.
export const ACC = "var(--accent)"; // brand accent (per-mode via --accent)
export const ACC_PRESS = "var(--accent-press)"; // pressed/hover accent
export const A = "#E5484D"; // Resume A - red (the only meaning of red in the UI)
export const B = "#2F9E66"; // Resume B - green (the only meaning of green in the UI)

export const FF = {
  display: "var(--font-display), ui-sans-serif, system-ui, sans-serif",
  body: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, monospace",
};

export type ThemeTokens = {
  bg: string;
  bg2: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentPress: string;
  accentSoft: string;
  accentTint: string;
  onAccent: string;
  accentText: string;
  glow: string;
  cardShadow: string;
  bgGradient: string;
};

export const THEME: Record<"dark" | "light", ThemeTokens> = {
  dark: {
    bg: "#0A0B0D",
    bg2: "#0E1014",
    surface: "#101319",
    surface2: "#161A22",
    border: "#2A313E",
    text: "#ECEEF2",
    muted: "#8A909B",
    faint: "#5A616C",
    accent: "#E7EAEF",
    accentPress: "#FFFFFF",
    accentSoft: "rgba(231,234,239,.16)",
    accentTint: "rgba(231,234,239,.26)",
    onAccent: "#0A0B0D",
    accentText: "#AEB6C2",
    glow: "radial-gradient(58% 48% at 80% 14%, rgba(148,168,214,.16), transparent 60%), radial-gradient(96% 62% at 50% -10%, rgba(120,140,182,.08), transparent 56%), radial-gradient(42% 42% at 6% 102%, rgba(180,196,226,.05), transparent 62%)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,.08), inset 0 -20px 60px -30px rgba(0,0,0,.5), 0 30px 80px -36px rgba(0,0,0,.8)",
    bgGradient: "linear-gradient(165deg, #0D1016 0%, #0A0B0E 44%, #070808 100%)",
  },
  light: {
    bg: "#F4F5F7",
    bg2: "#EEF0F3",
    surface: "#FDFDFE",
    surface2: "#F6F7F9",
    border: "#DCE0E6",
    text: "#15181C",
    muted: "#5B626B",
    faint: "#A6ACB5",
    accent: "#1B1E24",
    accentPress: "#000000",
    accentSoft: "rgba(27,30,36,.07)",
    accentTint: "rgba(27,30,36,.13)",
    onAccent: "#FFFFFF",
    accentText: "#4A515B",
    glow: "radial-gradient(60% 50% at 82% 10%, rgba(90,110,160,.16), transparent 60%), radial-gradient(100% 66% at 50% -14%, rgba(70,90,140,.10), transparent 58%), radial-gradient(44% 46% at 4% 104%, rgba(80,100,150,.08), transparent 64%)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(20,24,31,.04), 0 18px 44px -20px rgba(30,38,54,.16), 0 4px 12px -6px rgba(30,38,54,.08)",
    bgGradient: "linear-gradient(180deg, #F7F8FA 0%, #F1F3F6 52%, #EAEDF1 100%)",
  },
};
