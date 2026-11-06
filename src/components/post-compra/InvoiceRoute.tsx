"use client";

import { useSearchParams } from "next/navigation";
import { InvoiceView } from "./InvoiceView";

/** Lee la factura de la URL (`/factura?id=<invoiceId>`). Va dentro de `<Suspense>`. */
export function InvoiceRoute() {
  const params = useSearchParams();
  return <InvoiceView invoiceId={params.get("id") ?? ""} />;
}
