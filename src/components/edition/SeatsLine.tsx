"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { QuietDash, useShowPending } from "@/components/Pending";
import type { EditionLive } from "@/domain/selectors";
import { useEditionLive } from "./useEditionLive";

/**
 * Contador de cupos (wow 3), reducido a una línea fina: "Quedan 53 cupos" y un
 * filete que se acorta. Antes de hidratar muestra el valor semilla; con
 * `simulateLiveSales` baja solo. Con `prefers-reduced-motion` el número cambia
 * sin animación. El rótulo "aforo de ejemplo" solo se ve con "Mostrar pendientes".
 */
export function SeatsLine({
  initial,
  tone = "dark",
  className = "",
}: {
  initial: EditionLive;
  tone?: "dark" | "light";
  className?: string;
}) {
  const live = useEditionLive(initial);
  const reduce = useReducedMotion();
  const showPending = useShowPending();
  const dark = tone === "dark";
  const ink = dark ? "text-bond-cream" : "text-bond-night";

  if (live.soldOut) {
    return (
      <p className={`label-caps ${ink} ${className}`} role="status">
        All spots taken
      </p>
    );
  }
  if (live.capacity === null || live.remaining === null) {
    return (
      <p className={`label-caps ${ink} ${className}`}>
        Cupos <QuietDash />
      </p>
    );
  }
  const ratio = live.capacity > 0 ? live.remaining / live.capacity : 0;
  return (
    <div className={`${ink} ${className}`}>
      <p className="label-caps flex items-baseline gap-[0.6em]">
        <span aria-hidden>Quedan</span>
        <span aria-hidden className="relative inline-block min-w-[2ch] text-center tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={live.remaining}
              className="inline-block"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {live.remaining}
            </motion.span>
          </AnimatePresence>
        </span>
        <span aria-hidden>cupos{showPending && live.capacityIsExample ? " · aforo de ejemplo" : ""}</span>
      </p>
      <div className={`mt-3 h-px w-full max-w-[16rem] ${dark ? "bg-bond-cream/30" : "bg-bond-night/25"}`} aria-hidden>
        <div
          className={`h-full origin-left transition-transform duration-[var(--dur-slow)] ease-[var(--bond-ease)] ${dark ? "bg-bond-cream" : "bg-bond-night"}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <span role="status" className="sr-only">
        Quedan {live.remaining} de {live.capacity} cupos{live.capacityIsExample ? " (aforo de ejemplo)" : ""}.
      </span>
    </div>
  );
}
