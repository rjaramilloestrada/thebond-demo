"use client";

import { useSearchParams } from "next/navigation";
import { EntryView } from "./EntryView";

/** Lee el token de la URL (`/entrada?t=<token>`). Va dentro de `<Suspense>`. */
export function EntryRoute() {
  const params = useSearchParams();
  return <EntryView token={params.get("t") ?? ""} />;
}
