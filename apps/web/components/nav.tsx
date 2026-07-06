"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";

export function Nav() {
  const { mode, t, toggle } = useTheme();
  const isDark = mode === "dark";
  const onAbout = usePathname() === "/about";

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${t.border}`,
        background: isDark ? "rgba(10,11,13,.72)" : "rgba(255,255,255,.72)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 28px" }}
      >
        <Link
          href="/"
          className="flex items-center"
          style={{ gap: 9, textDecoration: "none", color: "inherit" }}
        >
          <FileText size={18} strokeWidth={2.2} color={t.text} />
          <span style={{ fontFamily: FF.display, fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.01em" }}>
            ResumeMatch Lab
          </span>
        </Link>
        <div className="flex items-center" style={{ gap: 22 }}>
          <button
            onClick={toggle}
            aria-label={isDark ? "Light mode" : "Dark mode"}
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              border: "none",
              background: "transparent",
              color: t.text,
              cursor: "pointer",
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            href="/about"
            style={{
              fontFamily: FF.body,
              fontSize: 13.5,
              fontWeight: 600,
              color: onAbout ? t.text : t.muted,
              textDecoration: "none",
              padding: "7px 15px",
              borderRadius: 9,
              border: `1px solid ${onAbout ? "var(--accent)" : "var(--accent-soft)"}`,
              background: onAbout ? "var(--accent-tint)" : "transparent",
              transition: "color .15s ease, border-color .15s ease, background .15s ease",
            }}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
