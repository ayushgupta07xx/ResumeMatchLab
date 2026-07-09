"use client";
import { Btn } from "@/components/btn";

import { useRef, useState, type CSSProperties } from "react";
import { UploadCloud, X } from "lucide-react";
import { useTheme } from "@/lib/providers";
import { FF, type ThemeTokens } from "@/lib/theme";

const CARD: CSSProperties = {
  position: "relative",
  background: "transparent",
  border: "1px solid var(--accent)",
  borderRadius: 16,
  padding: 20,
};

function Head({
  side,
  color,
  t,
  label,
  badge,
}: {
  side: "A" | "B";
  color: string;
  t: ThemeTokens;
  label?: string;
  badge?: string;
}) {
  const glyph = badge ?? side;
  const text = label ?? `Résumé ${side}`;
  return (
    <div className="flex items-center" style={{ gap: 9 }}>
      {glyph ? (
        <span
          style={{
            fontFamily: FF.display,
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `${color}22`,
            color,
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          {glyph}
        </span>
      ) : null}
      <span style={{ fontSize: 13.5, fontWeight: 600, color: t.muted }}>{text}</span>
    </div>
  );
}

export function UploadZone({
  side,
  color,
  file,
  onChange,
  label,
  badge,
}: {
  side: "A" | "B";
  color: string;
  file: File | null;
  onChange: (f: File | null) => void;
  label?: string;
  badge?: string;
}) {
  const { t } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");

  if (file) {
    const isPasted = file.name === "Pasted text.txt";
    const size = isPasted
      ? `${file.size.toLocaleString()} chars`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    return (
      <div style={CARD}>
        <div className="flex items-center justify-between" style={{ gap: 10 }}>
          <Head side={side} color={color} t={t} label={label} badge={badge} />
          <button
            onClick={() => {
              onChange(null);
              setText("");
              setMode("upload");
            }}
            aria-label="Remove"
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--accent-soft)",
              background: "transparent",
              color: t.muted,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ marginTop: 18, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: t.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isPasted ? "Pasted text" : file.name}
          </div>
          <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: t.muted, marginTop: 4 }}>{size}</div>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: "var(--accent-soft)", marginTop: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", background: color, opacity: 0.85 }} />
        </div>
      </div>
    );
  }

  const seg = (m: "upload" | "paste", label: string) => (
    <button
      onClick={() => setMode(m)}
      style={{
        flex: 1,
        padding: "7px 0",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontFamily: FF.body,
        fontSize: 12.5,
        fontWeight: 600,
        background: mode === m ? "var(--accent)" : "transparent",
        color: mode === m ? "var(--on-accent)" : t.muted,
        transition: "background .12s, color .12s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      onDragOver={(e) => {
        if (mode === "upload") {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (mode !== "upload") return;
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onChange(f);
      }}
      style={{
        ...CARD,
        border: `1px solid ${over ? color : "var(--accent)"}`,
        background: over ? "var(--accent-soft)" : "transparent",
        transition: "border-color .15s, background .15s",
      }}
    >
      <Head side={side} color={color} t={t} label={label} badge={badge} />

      <div style={{ display: "flex", gap: 4, marginTop: 16, padding: 3, background: "var(--accent-soft)", borderRadius: 10 }}>
        {seg("upload", "Upload file")}
        {seg("paste", "Paste text")}
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          style={{ cursor: "pointer", textAlign: "center", padding: "26px 16px 18px" }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange(f);
            }}
          />
          <UploadCloud size={26} color={t.faint} strokeWidth={1.6} style={{ margin: "4px auto 12px", display: "block" }} />
          <div style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>Drop a file or click to browse</div>
          <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: t.faint, marginTop: 6 }}>PDF · DOCX · TXT</div>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your résumé text…"
            style={{
              width: "100%",
              height: 128,
              resize: "none",
              borderRadius: 10,
              padding: 12,
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-soft)",
              color: t.text,
              fontSize: 13,
              fontFamily: FF.body,
              outline: "none",
            }}
          />
          <Btn
            variant="ghost"
            onClick={() => {
              if (text.trim().length >= 1) {
                onChange(new File([text], "Pasted text.txt", { type: "text/plain" }));
              }
            }}
            disabled={text.trim().length === 0}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "9px 0",
              borderRadius: 9,
              fontFamily: FF.body,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Use this text
          </Btn>
        </div>
      )}
    </div>
  );
}
