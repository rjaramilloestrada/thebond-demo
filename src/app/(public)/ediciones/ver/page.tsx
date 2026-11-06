import type { Metadata } from "next";
import { Suspense } from "react";
import { DynamicEditionRoute } from "@/components/edition/DynamicEditionRoute";

/*
 * Ediciones que no están en los datos semilla (las que cree el wizard de la
 * Fase 5) viven en `/ediciones/ver?slug=<slug>` y se resuelven en el cliente
 * contra el store. Las ediciones semilla tienen su página estática en
 * `/ediciones/<slug>`. Sin contenido propio en el HTML: no se indexa.
 */
export const metadata: Metadata = {
  title: "Edición",
  robots: { index: false, follow: false },
};

export default function DynamicEditionPage() {
  return (
    <Suspense fallback={<main id="contenido" aria-busy="true" className="min-h-svh bg-bond-night" />}>
      <DynamicEditionRoute />
    </Suspense>
  );
}
