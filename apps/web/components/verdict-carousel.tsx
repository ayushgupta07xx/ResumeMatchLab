"use client";
import { useEffect, useState } from "react";
import { ResultVerdict } from "@/components/result-verdict";
import { DEMO_VARIANTS } from "@/lib/demo-variants";

export function VerdictCarousel() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const HOLD = 2200; // 2200 hold + 800 fade = 3000ms per card
    const FADE = 800;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % DEMO_VARIANTS.length);
        setShow(true);
      }, FADE);
    }, HOLD + FADE);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ opacity: show ? 1 : 0, transition: "opacity 800ms cubic-bezier(0.33,0,0.2,1)" }}>
      <ResultVerdict key={idx} data={DEMO_VARIANTS[idx]} />
    </div>
  );
}
