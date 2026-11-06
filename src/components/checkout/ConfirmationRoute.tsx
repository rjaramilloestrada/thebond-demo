"use client";

import { useSearchParams } from "next/navigation";
import { ConfirmationView } from "./ConfirmationView";

/** Lee la orden de la URL (`/comprar/confirmacion?orden=<id>`). Va dentro de `<Suspense>`. */
export function ConfirmationRoute() {
  const params = useSearchParams();
  return <ConfirmationView orderId={params.get("orden") ?? ""} />;
}
