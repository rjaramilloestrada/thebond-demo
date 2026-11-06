"use client";

import type { EditionLive } from "@/domain/selectors";
import { buttonBase, buttonTones, type ButtonTone } from "@/components/ui/button-styles";
import { useSheetStore } from "@/store/sheet-store";
import { useEditionLive } from "./useEditionLive";

/**
 * "Get your ticket": abre la hoja de compra de la misma página. Si la edición
 * está agotada (incluye el interruptor `forceSoldOut`) es un enlace a la lista de espera.
 */
export function OpenSheetButton({
  initial,
  tone = "cream",
  className = "",
}: {
  initial: EditionLive;
  tone?: ButtonTone;
  className?: string;
}) {
  const live = useEditionLive(initial);
  const openSheet = useSheetStore((s) => s.openSheet);
  const cls = `${buttonBase} ${buttonTones[tone]} ${className}`;
  if (live.soldOut) {
    return (
      <a href="#lista-de-espera" data-hero-cta className={cls}>
        Lista de espera <span aria-hidden>↓</span>
      </a>
    );
  }
  return (
    <button type="button" data-testid="open-sheet" data-hero-cta aria-haspopup="dialog" onClick={openSheet} className={cls}>
      Get your ticket
      <span aria-hidden className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}
