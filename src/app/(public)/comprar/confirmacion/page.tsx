import { Suspense } from "react";
import { ConfirmationRoute } from "@/components/checkout/ConfirmationRoute";

/** Confirmación posterior al pago: `/comprar/confirmacion?orden=<id>`, un ticket con QR único por asistente. */
export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={<main id="contenido" aria-busy="true" className="surface-dark grain relative isolate overflow-hidden bg-bond-night" />}
    >
      <ConfirmationRoute />
    </Suspense>
  );
}
