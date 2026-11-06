"use client";

import { useEffect, useState } from "react";
import type { EditionLive } from "@/domain/selectors";
import { useSheetStore } from "@/store/sheet-store";
import { useEditionLive } from "./useEditionLive";

/**
 * Un solo botón fijo que abre la hoja de compra (en móvil, siempre a un pulgar;
 * en escritorio, una pastilla discreta abajo a la derecha). Aparece cuando el
 * hero (con su propio CTA) ya salió de la pantalla y se esconde con el pie y con
 * la hoja abierta. Con la edición agotada apunta a la lista de espera.
 */
export function StickyCta({ initial }: { initial: EditionLive }) {
  const live = useEditionLive(initial);
  const sheetOpen = useSheetStore((s) => s.open);
  const openSheet = useSheetStore((s) => s.openSheet);
  const [heroVisible, setHeroVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-cta]");
    const footer = document.querySelector("footer");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroVisible(e.isIntersecting);
        else setFooterVisible(e.isIntersecting);
      }
    });
    if (hero) io.observe(hero);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, []);

  const visible = !heroVisible && !footerVisible && !sheetOpen;
  const cls =
    "label-caps inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-sm bg-bond-olive px-6 !text-[0.75rem] text-bond-cream transition-colors duration-[var(--dur-fast)] hover:bg-bond-moss md:w-auto md:px-8 md:shadow-lg";
  return (
    <div
      data-sticky-cta
      data-visible={visible}
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-[transform,opacity] duration-[var(--dur-slow)] ease-[var(--bond-ease)] md:inset-x-auto md:right-8 md:bottom-8 md:p-0 print:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {live.soldOut ? (
        <a href="#lista-de-espera" className={cls}>
          Lista de espera <span aria-hidden>↓</span>
        </a>
      ) : (
        <button type="button" data-testid="sticky-open-sheet" aria-haspopup="dialog" onClick={openSheet} className={cls}>
          Get your ticket <span aria-hidden>→</span>
        </button>
      )}
    </div>
  );
}
