import { Suspense } from "react";
import { EmailPreviewRoute } from "@/components/post-compra/EmailPreviewRoute";

/**
 * Vista previa de un correo registrado: `/correo?id=<emailId>`. Exportación
 * estática: el correo se resuelve en el cliente a partir del registro guardado.
 */
export default function EmailPreviewPage() {
  return (
    <Suspense fallback={<main id="contenido" aria-busy="true" className="min-h-svh bg-bond-sand" />}>
      <EmailPreviewRoute />
    </Suspense>
  );
}
