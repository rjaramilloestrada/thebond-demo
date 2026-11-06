"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/* Se carga solo cuando hace falta: no entra en el JS inicial de la página */
const ReactLenis = dynamic(() => import("lenis/react").then((m) => m.ReactLenis), { ssr: false });

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Scroll suave con Lenis (`lenis/react`), solo en el sitio público.
 * - Con `prefers-reduced-motion` no se activa (el scroll queda nativo).
 * - En pantallas táctiles tampoco: se deja el scroll nativo (Lenis no sincroniza
 *   el touch por defecto, pero así ahorramos el JS).
 */
export function SmoothScroll() {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  if (reduce || !finePointer) return null;
  return <ReactLenis root options={{ autoRaf: true, anchors: true }} />;
}
