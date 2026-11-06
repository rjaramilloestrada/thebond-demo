import type { ReactNode } from "react";

/**
 * Barra fija inferior en móvil y tablet: total y botón principal siempre al
 * alcance del pulgar (brief 4.1). En escritorio el botón va al final del formulario.
 */
export function CheckoutBar({ total, children }: { total: string; children: ReactNode }) {
  return (
    <div
      data-checkout-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bond-night/15 bg-bond-cream/95 text-bond-night backdrop-blur-sm lg:hidden print:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-column flex items-center justify-between gap-4 py-3">
        <p className="min-w-0">
          <span className="label-caps block !text-[0.625rem] text-bond-olive">Total</span>
          <span className="font-display text-2xl leading-none">{total}</span>
        </p>
        {children}
      </div>
    </div>
  );
}

export const barButton =
  "label-caps inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-bond-olive px-6 !text-[0.75rem] text-bond-cream hover:bg-bond-moss disabled:cursor-wait disabled:opacity-70";
