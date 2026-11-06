import { Suspense } from "react";
import { InvoiceRoute } from "@/components/post-compra/InvoiceRoute";

/** Vista previa del RIDE de una factura: `/factura?id=<invoiceId>` (exportación estática, resuelta en el cliente). */
export default function InvoicePage() {
  return (
    <Suspense fallback={<main id="contenido" aria-busy="true" className="min-h-svh bg-bond-sand" />}>
      <InvoiceRoute />
    </Suspense>
  );
}
