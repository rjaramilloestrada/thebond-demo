"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/domain/pricing";
import type { EditionLive } from "@/domain/selectors";
import { selectionTotal, useSelectionStore } from "@/store/selection-store";
import { useEditionLive } from "./useEditionLive";
import { useReserve } from "./useReserve";

/**
 * Barra fija inferior solo en móvil (brief 4.1: el CTA siempre a un pulgar).
 * Sin selección muestra precio "desde", cupos y "Get your ticket", y se oculta
 * cuando la sección #entradas (o el pie) está a la vista. Con selección cambia a
 * "N entradas · Continuar", que reserva los cupos, y se queda visible sobre
 * #entradas para que el botón siempre esté al alcance del pulgar, salvo cuando
 * el "Continuar" de la página (#continuar-inline) está en pantalla: nunca se ven
 * dos "Continuar" a la vez.
 */
export function StickyCta({ initial, editionId }: { initial: EditionLive; editionId: string }) {
  const live = useEditionLive(initial);
  const quantity = useSelectionStore((s) => selectionTotal(s.quantities));
  const reserving = useSelectionStore((s) => s.reserving);
  const reserve = useReserve(editionId);
  const [covered, setCovered] = useState(false);
  const [footerCovered, setFooterCovered] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(false);

  useEffect(() => {
    const entradas = document.getElementById("entradas");
    const footer = document.querySelector("footer");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === entradas) setCovered(e.isIntersecting);
        else setFooterCovered(e.isIntersecting);
      }
    });
    if (entradas) io.observe(entradas);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, []);

  const hasSelection = quantity > 0 && !live.soldOut;

  // Con selección, el "Continuar" inline y el de la barra no se muestran juntos
  useEffect(() => {
    const inline = hasSelection ? document.getElementById("continuar-inline") : null;
    if (!inline) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) setInlineVisible(e.isIntersecting);
    });
    io.observe(inline);
    return () => io.disconnect();
  }, [hasSelection]);

  // `inlineVisible` solo vale mientras haya selección (si no, el botón inline no existe)
  const visible = hasSelection ? !footerCovered && !inlineVisible : !covered && !footerCovered;
  const price = live.fromPrice;
  const href = live.soldOut ? "#lista-de-espera" : "#entradas";

  const buttonClass =
    "label-caps inline-flex min-h-12 shrink-0 items-center gap-2 rounded-sm bg-bond-butter px-5 !text-[0.75rem] text-bond-night disabled:cursor-wait disabled:opacity-70";

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
          ) : hasSelection ? (
            <>
              <p className="label-caps text-bond-sand">Tu selección</p>
              <p className="font-display text-2xl leading-none" data-testid="sticky-count">
                {quantity} {quantity === 1 ? "entrada" : "entradas"}
              </p>
            </>
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
        {hasSelection ? (
          <button
            type="button"
            data-testid="sticky-continuar"
            disabled={reserving}
            className={buttonClass}
            onClick={() => void reserve()}
          >
            {reserving ? "Reservando…" : "Continuar"}
            <span aria-hidden>→</span>
          </button>
        ) : (
          <a href={href} className={buttonClass}>
            {live.soldOut ? "Lista de espera" : "Get your ticket"}
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
}
