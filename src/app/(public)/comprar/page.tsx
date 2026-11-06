import { Suspense } from "react";
import { CheckoutRoute } from "@/components/checkout/CheckoutRoute";

/**
 * Pantallas 2 (datos) y 3 (`&paso=pago`, caja de pagos) del flujo de compra:
 * `/comprar?orden=<id>`. Exportación estática: la orden se lee en el cliente.
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={<main id="contenido" aria-busy="true" className="min-h-svh bg-bond-cream" />}>
      <CheckoutRoute />
    </Suspense>
  );
}
