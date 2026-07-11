"use client";
import { Btn } from "@/components/btn";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Logo } from "@/components/logo";
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
          <Logo size={20} />
          <span style={{ fontFamily: FF.display, fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.01em" }}>
            ResumeMatch Lab
          </span>
        </Link>
        <div className="flex items-center" style={{ gap: 22 }}>
          <Btn
            variant="ghost"
            borderless
            onClick={toggle}
            aria-label={isDark ? "Light mode" : "Dark mode"}
            style={{
              width: 34,
              height: 34,
              padding: 0,
              borderRadius: 999,
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Btn>
          <Btn
            variant="ghost"
            href="/about"
            active={onAbout}
            style={{
              fontFamily: FF.body,
              fontSize: 13.5,
              fontWeight: 600,
              padding: "7px 15px",
              borderRadius: 9,
            }}
          >
            About
          </Btn>
        </div>
      </div>
    </nav>
  );
}
