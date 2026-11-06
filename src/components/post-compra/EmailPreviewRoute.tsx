"use client";

import { useSearchParams } from "next/navigation";
import { EmailPreviewView } from "./EmailPreviewView";

/** Lee el correo de la URL (`/correo?id=<emailId>`). Va dentro de `<Suspense>`. */
export function EmailPreviewRoute() {
  const params = useSearchParams();
  return <EmailPreviewView emailId={params.get("id") ?? ""} />;
}
