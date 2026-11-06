"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoPill } from "./DemoPill";
import { Monogram } from "./Monogram";

/**
 * Encabezado mínimo: monograma y píldora Demo. Va sobre el contenido (absoluto,
 * se va con el scroll), así que no puede taparlo. El color depende de la pantalla:
 * crema sobre los heroes oliva, noche y atardecer; oliva sobre las pantallas claras
 * (datos y pago, correo, factura). En el home el logo grande ya es el héroe, así
 * que ahí solo queda la píldora.
 */
const INK_ROUTES = ["/comprar", "/correo", "/factura"];

export function SiteHeader() {
  const raw = usePathname() ?? "/";
  const path = raw.length > 1 ? raw.replace(/\/$/, "") : raw;
  const onLight = INK_ROUTES.includes(path);
  const home = path === "/";
  return (
    <header
      className={`absolute inset-x-0 top-0 z-30 print:hidden ${onLight ? "text-bond-olive" : "surface-mid text-bond-cream"}`}
    >
      <div className="container-editorial flex min-h-[4.5rem] items-center justify-between md:min-h-24">
        {home ? (
          <span aria-hidden />
        ) : (
          <Link href="/" aria-label="THE BOND, inicio" className="inline-flex min-h-11 items-center">
            <Monogram size={44} className="shrink-0" />
          </Link>
        )}
        <DemoPill />
      </div>
    </header>
  );
}
