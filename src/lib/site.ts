/**
 * Datos del sitio. La URL base viene de NEXT_PUBLIC_SITE_URL (se define en el
 * deploy, Fase 7). [[PENDIENTE: dominio preferido]]: hasta entonces se usa localhost.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "THE BOND";
export const SITE_TAGLINE = "A wellness community. Move. Connect. Belong.";
export const OG_IMAGE = "/placeholders/hero-edicion-1280.webp";
