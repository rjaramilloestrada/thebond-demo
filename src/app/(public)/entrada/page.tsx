import { Suspense } from "react";
import { EntryRoute } from "@/components/post-compra/EntryRoute";

/**
 * "Mi entrada": `/entrada?t=<token>` (exportación estática: el token firmado va
 * por query param y se verifica en el cliente contra lo guardado).
 */
export default function EntryPage() {
  return (
    <Suspense fallback={<main id="contenido" aria-busy="true" className="surface-dark grain relative isolate min-h-svh overflow-hidden bg-bond-night" />}>
      <EntryRoute />
    </Suspense>
  );
}
