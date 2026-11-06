"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pending } from "@/components/Pending";
import { pending } from "@/lib/pending";
import type { EditionLive } from "@/domain/selectors";
import { useEditionLive } from "./useEditionLive";

/**
 * Contador de cupos (wow 3, brief 4.2): número y barra que cambian en vivo.
 * Antes de hidratar muestra el valor semilla; con `simulateLiveSales` baja solo.
 * Con `prefers-reduced-motion` el número cambia sin animación.
 */
export function SeatsCounter({
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
  const dark = tone === "dark";
  const text = dark ? "text-bond-cream" : "text-bond-night";
  const sub = dark ? "text-bond-sand" : "text-bond-olive";

  if (live.soldOut) {
    return (
      <div className={`${text} ${className}`}>
        <p className="display-serif text-heading">All spots taken</p>
        <p className={`mt-2 text-sm ${sub}`}>Esta edición se agotó.</p>
      </div>
    );
  }

  if (live.capacity === null || live.remaining === null) {
    return (
      <p className={`${text} ${className}`}>
        <Pending text={pending("aforo de la edición")} />
      </p>
    );
  }

  const ratio = live.capacity > 0 ? live.remaining / live.capacity : 0;
  return (
    <div className={`${text} ${className}`}>
      <div className="flex items-baseline gap-4">
        <span aria-hidden className="relative inline-block min-w-[2ch] font-display text-6xl leading-none tabular-nums md:text-7xl">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={live.remaining}
              className="inline-block"
              initial={reduce ? false : { y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 1 } : { y: 16, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {live.remaining}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="label-caps">cupos restantes</span>
      </div>
      <div className={`mt-5 h-1 w-full overflow-hidden ${dark ? "bg-bond-cream/25" : "bg-bond-night/15"}`} aria-hidden>
        <div
          className={`h-full origin-left transition-transform duration-[var(--dur-slow)] ease-[var(--bond-ease)] ${dark ? "bg-bond-butter" : "bg-bond-night"}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <p className={`mt-3 text-xs ${sub}`}>
        de {live.capacity}
        {live.capacityIsExample ? " · aforo de ejemplo" : ""}
      </p>
      <span role="status" className="sr-only">
        Quedan {live.remaining} de {live.capacity} cupos{live.capacityIsExample ? " (aforo de ejemplo)" : ""}.
      </span>
    </div>
  );
}
