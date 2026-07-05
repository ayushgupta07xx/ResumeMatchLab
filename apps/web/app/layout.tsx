import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/lib/providers";
import { ThemedShell } from "@/components/themed-shell";
import "./globals.css";

// Geist (from SafetyVision) — variable faces, 100–900.
const display = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});
const body = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeMatch Lab — which resume wins?",
  description: "A/B test two resume versions against 9,014 Indian tech jobs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <ThemedShell>{children}</ThemedShell>
        </Providers>
      </body>
    </html>
  );
}
