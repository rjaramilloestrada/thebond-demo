import { publishedEditions } from "@/domain/selectors";
import { seed } from "@/seed/seed";

/*
 * Rutas del sitio. Es una exportación estática: no hay rutas con ID en tiempo de
 * ejecución, así que las órdenes y las ediciones nuevas viajan por query param.
 * Pasar siempre por estos helpers (no armar las URLs a mano). Next antepone el
 * basePath a next/link y next/navigation por su cuenta.
 */

/** Pantallas 2 (datos) y 3 (caja de pagos) del flujo de compra. */
export function checkoutHref(orderId: string, step?: "pago"): string {
  const base = `/comprar?orden=${encodeURIComponent(orderId)}`;
  return step === "pago" ? `${base}&paso=pago` : base;
}

/** Confirmación posterior al pago. */
export function confirmationHref(orderId: string): string {
  return `/comprar/confirmacion?orden=${encodeURIComponent(orderId)}`;
}

let seedSlugs: Set<string> | undefined;

/**
 * Página de una edición. Las ediciones semilla tienen su página estática
 * (`/ediciones/<slug>`); cualquier otra (por ejemplo, las que cree el wizard de
 * la Fase 5) se resuelve en el cliente en `/ediciones/ver?slug=<slug>`.
 */
export function editionHref(slug: string): string {
  seedSlugs ??= new Set(publishedEditions(seed().editions).map((e) => e.slug));
  return seedSlugs.has(slug) ? `/ediciones/${slug}` : `/ediciones/ver?slug=${encodeURIComponent(slug)}`;
}

/** Vista previa de un correo registrado (`EmailLog`): `/correo?id=<emailId>`. */
export function emailHref(emailId: string): string {
  return `/correo?id=${encodeURIComponent(emailId)}`;
}

/** Vista previa del RIDE de una factura: `/factura?id=<invoiceId>`. */
export function invoiceHref(invoiceId: string): string {
  return `/factura?id=${encodeURIComponent(invoiceId)}`;
}

/** "Mi entrada": el token QR firmado viaja por query param, no por segmento. */
export function entryHref(token: string): string {
  return `/entrada?t=${encodeURIComponent(token)}`;
}

/**
 * Ruta con barra final antes de la query o el ancla (`/entrada?t=x` → `/entrada/?t=x`).
 * Las URLs absolutas que viajan dentro de un correo no pasan por next/link, así
 * que llevan ya la forma canónica del export estático (`trailingSlash: true`).
 */
export function withTrailingSlash(href: string): string {
  const i = href.search(/[?#]/);
  const path = i === -1 ? href : href.slice(0, i);
  const rest = i === -1 ? "" : href.slice(i);
  return `${path.endsWith("/") ? path : `${path}/`}${rest}`;
}
