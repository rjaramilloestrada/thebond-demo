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
