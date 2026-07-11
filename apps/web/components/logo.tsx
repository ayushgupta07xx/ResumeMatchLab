"use client";

import { useTheme } from "@/lib/providers";
import { FF } from "@/lib/theme";

export function Logo({ size = 20 }: { size?: number }) {
  const { t } = useTheme();
  const width = (size * 48) / 46;
  return (
    <svg
      width={width}
      height={size}
      viewBox="11 11 48 46"
      role="img"
      aria-label="ResumeMatch Lab"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M12,12 L34,12 L44,22 L44,54 L12,54 Z" fill={t.text} />
      <path d="M34,12 L34,22 L44,22" fill="none" stroke={t.bg} strokeWidth={2} />
      <text
        x={24.5}
        y={34}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FF.display}
        fontWeight={700}
        fontSize={22}
        fill={t.bg}
      >
        A
      </text>
      <rect x={37} y={35} width={21} height={21} rx={4} fill={t.bg} stroke={t.text} strokeWidth={2.4} />
      <text
        x={47.5}
        y={45.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FF.display}
        fontWeight={700}
        fontSize={14}
        fill={t.text}
      >
        B
      </text>
    </svg>
  );
}
