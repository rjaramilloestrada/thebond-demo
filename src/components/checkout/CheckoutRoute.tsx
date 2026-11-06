"use client";

import { useSearchParams } from "next/navigation";
import { CheckoutFlow } from "./CheckoutFlow";

/**
 * Lee la orden de la URL (`/comprar?orden=<id>`, y `&paso=pago` para la caja de
 * pagos). Exportación estática: no hay segmento dinámico. Debe renderizarse
 * dentro de `<Suspense>` (lo hace la página).
 */
export function CheckoutRoute() {
  const params = useSearchParams();
  return <CheckoutFlow orderId={params.get("orden") ?? ""} step={params.get("paso") === "pago" ? "pago" : "datos"} />;
}
