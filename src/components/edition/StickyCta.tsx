"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/domain/pricing";
import type { EditionLive } from "@/domain/selectors";
import { useEditionLive } from "./useEditionLive";

/**
 * Barra fija inferior solo en móvil (brief 4.1: el CTA siempre a un pulgar).
 * Muestra precio "desde", cupos y "Get your ticket". Se oculta cuando la
 * sección #entradas (o el pie) está a la vista.
 */
export function StickyCta({ initial }: { initial: EditionLive }) {
  const live = useEditionLive(initial);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const targets: Element[] = [];
    const entradas = document.getElementById("entradas");
    const footer = document.querySelector("footer");
    if (entradas) targets.push(entradas);
    if (footer) targets.push(footer);
    if (targets.length === 0) return;
    const inView = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inView.add(e.target);
        else inView.delete(e.target);
      }
      setCovered(inView.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const visible = !covered;
  const price = live.fromPrice;
  const href = live.soldOut ? "#lista-de-espera" : "#entradas";

  return (
    <div
      data-sticky-cta
      data-visible={visible}
      aria-hidden={!visible}
      inert={!visible}
      className={`surface-dark fixed inset-x-0 bottom-0 z-40 border-t border-bond-cream/15 bg-bond-night text-bond-cream transition-transform duration-[var(--dur-base)] ease-[var(--bond-ease)] md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-editorial flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          {live.soldOut ? (
            <p className="display-serif text-lg leading-tight">All spots taken</p>
          ) : (
            <>
              <p className="flex items-baseline gap-2">
                <span className="label-caps text-bond-sand">Desde</span>
                <span className="font-display text-2xl leading-none">
                  {price ? formatMoney(price.amountCents, { isExample: price.isExample }) : "—"}
                </span>
              </p>
              <p className="mt-1 text-xs text-bond-sand">
                {live.remaining !== null ? `${live.remaining} cupos` : "Cupos por confirmar"}
                {price?.isExample ? " · ejemplo" : ""}
              </p>
            </>
          )}
        </div>
        <a
          href={href}
          className="label-caps inline-flex min-h-12 shrink-0 items-center gap-2 rounded-sm bg-bond-butter px-5 !text-[0.75rem] text-bond-night"
        >
          {live.soldOut ? "Lista de espera" : "Get your ticket"}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
