import type { ReactNode } from "react";

/**
 * Barra fija inferior en móvil y tablet: total y botón principal siempre al
 * alcance del pulgar (brief 4.1). En escritorio el botón vive en el resumen.
 */
export function CheckoutBar({ total, isExample, children }: { total: string; isExample: boolean; children: ReactNode }) {
  return (
    <div
      data-checkout-bar
      className="surface-dark fixed inset-x-0 bottom-0 z-40 border-t border-bond-cream/15 bg-bond-night text-bond-cream lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-editorial flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="label-caps text-bond-sand">Total{isExample ? " · ejemplo" : ""}</p>
          <p className="font-display text-2xl leading-none">{total}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export const barButton =
  "label-caps inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-bond-butter px-5 !text-[0.75rem] text-bond-night disabled:cursor-wait disabled:opacity-70";
