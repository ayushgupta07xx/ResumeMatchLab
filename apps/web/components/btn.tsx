"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/providers";

type Variant = "ghost" | "filled";

/**
 * Uniform button with the invert-on-hover effect from the forest-plot back button.
 * - ghost:  transparent + accent border  ->  accent fill + bg-colored text on hover
 * - filled: accent fill + on-accent text ->  transparent + accent text on hover
 * Props:
 * - href:       render a Next <Link> (keeps client routing) instead of <button>.
 * - active:     lock the inverted (hover) skin on — e.g. a current-route nav item.
 * - borderless: drop the border (icon buttons).
 * - disabled:   no invert, dimmed (button only).
 * Extra `style` merges on top of the base.
 */
export function Btn({
  children,
  onClick,
  href,
  variant = "ghost",
  active = false,
  disabled = false,
  borderless = false,
  style,
  type = "button",
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: Variant;
  active?: boolean;
  disabled?: boolean;
  borderless?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
  title?: string;
  "aria-label"?: string;
}) {
  const { t } = useTheme();
  const [hover, setHover] = useState(false);
  const on = (hover || active) && !disabled;

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 999,
    border: borderless ? "none" : "1px solid var(--accent)",
    cursor: disabled ? "default" : "pointer",
    transition: "all 160ms ease",
    opacity: disabled ? 0.5 : 1,
    textDecoration: "none",
  };

  const skin: CSSProperties =
    variant === "filled"
      ? {
          background: on ? "transparent" : "var(--accent)",
          color: on ? "var(--accent)" : "var(--on-accent)",
        }
      : {
          background: on ? "var(--accent)" : "transparent",
          color: on ? t.bg : t.text,
        };

  const merged = { ...base, ...skin, ...style };

  if (href && !disabled) {
    return (
      <Link
        href={href}
        title={title}
        aria-label={ariaLabel}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={merged}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={merged}
    >
      {children}
    </button>
  );
}
