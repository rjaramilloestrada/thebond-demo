"use client";

import type { ReactNode } from "react";
import { splitPending, stripPending } from "@/lib/pending";
import { useDemoStore } from "@/store/demo-store";

/**
 * Modo presentación (decisión de Rafa, enmienda a la regla 0.1 del brief):
 * `showPending` apagado es el valor por defecto. Antes de hidratar el store vale
 * false, así que el HTML estático nunca trae marcadores.
 */
export function useShowPending(): boolean {
  return useDemoStore((s) => s.showPending);
}

/** Guion discreto para un valor que hace falta estructuralmente y está pendiente. */
export function QuietDash() {
  return (
    <span role="img" aria-label="Por confirmar">
      —
    </span>
  );
}

/**
 * Render de los marcadores `[[PENDIENTE: descripción]]` (brief 0.1).
 * - Modo presentación apagado: no se ve ningún marcador. Si queda texto real, se
 *   muestra sin el marcador; si no queda nada, nada (o un guion con `dash`).
 * - Modo presentación encendido: los marcadores se resaltan para que nadie los
 *   confunda con datos reales.
 */
export function Pending({
  text,
  className = "",
  dash = false,
  forceShow = false,
}: {
  text: string;
  className?: string;
  /** Si no queda nada que mostrar, un guion discreto en lugar de nada */
  dash?: boolean;
  /** Siempre resaltado, sin importar el modo presentación (solo la página de referencia /tokens) */
  forceShow?: boolean;
}) {
  const storeShow = useShowPending();
  const show = forceShow || storeShow;
  if (!show) {
    const clean = stripPending(text);
    if (clean) return <>{clean}</>;
    return dash ? <QuietDash /> : null;
  }
  const segments = splitPending(text);
  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <mark
            key={i}
            data-pending={seg.description}
            title="Dato pendiente de confirmar. Está registrado en PENDIENTES.md"
            className={`box-decoration-clone rounded-sm bg-bond-butter px-1.5 py-0.5 font-sans text-[0.85em] font-medium not-italic normal-case tracking-normal text-bond-night ring-1 ring-bond-night/25 ${className}`}
          >
            {seg.raw}
          </mark>
        ),
      )}
    </>
  );
}

/** Texto plano sin marcadores (para `aria-label`, `alt` y similares) cuando el modo presentación está apagado. */
export function usePlainText(text: string): string {
  const show = useShowPending();
  return show ? text : stripPending(text);
}

/** Contenido que solo existe cuando se muestran los pendientes (por ejemplo, una nota "Texto legal: [[PENDIENTE]]"). */
export function WhenShowingPending({ children }: { children: ReactNode }) {
  return useShowPending() ? <>{children}</> : null;
}

/**
 * Teaser al estilo de los reveals de su Instagram: "Speaker reveal · soon".
 * Reemplaza una sección cuyo contenido aún es todo pendiente.
 */
export function Teaser({ label, tone = "dark", className = "" }: { label: string; tone?: "dark" | "light"; className?: string }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-x-3 ${tone === "light" ? "text-bond-cream" : "text-bond-night"} ${className}`}>
      <span className="font-display text-xl italic leading-tight md:text-2xl">{label}</span>
      <span aria-hidden className={`h-px w-6 self-center ${tone === "light" ? "bg-bond-cream/50" : "bg-bond-night/40"}`} />
      <span className="label-caps">soon</span>
    </p>
  );
}

/**
 * Muestra `children` si hay datos reales (o si se muestran los pendientes);
 * si no, el teaser. Una sección entera pendiente pasa a ser una sola línea elegante.
 */
export function PendingGate({
  hasData,
  teaser,
  children,
}: {
  hasData: boolean;
  teaser: ReactNode;
  children: ReactNode;
}) {
  const show = useShowPending();
  return hasData || show ? <>{children}</> : <>{teaser}</>;
}
