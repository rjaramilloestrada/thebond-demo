"use client";

import { useSearchParams } from "next/navigation";
import { DynamicEdition } from "./DynamicEdition";

/** Lee el slug de la URL (`/ediciones/ver?slug=<slug>`). Va dentro de `<Suspense>`. */
export function DynamicEditionRoute() {
  return <DynamicEdition slug={useSearchParams().get("slug") ?? ""} />;
}
