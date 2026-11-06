"use client";

import { useState } from "react";

/** Botón para pausar el marquee (WCAG 2.2.2). Además pausa solo en hover y en foco. */
export function MarqueePause({ targetId }: { targetId: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        document.getElementById(targetId)?.setAttribute("data-paused", String(next));
      }}
      className="marquee-pause label-caps inline-flex min-h-11 items-center rounded-sm border border-bond-cream/50 px-4 text-bond-cream transition-colors duration-[var(--dur-fast)] hover:bg-bond-cream hover:text-bond-night"
    >
      {paused ? "Reanudar movimiento" : "Pausar movimiento"}
    </button>
  );
}
