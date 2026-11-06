/**
 * Datos del sitio. La URL base viene de NEXT_PUBLIC_SITE_URL (incluye la
 * subruta en el build de GitHub Pages). [[PENDIENTE: dominio preferido]]: hasta
 * entonces se usa localhost.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "THE BOND";
export const SITE_TAGLINE = "A wellness community. Move. Connect. Belong.";

/**
 * Subruta de despliegue (`/thebond-demo` en GitHub Pages; vacía en local). Debe
 * coincidir con el `basePath` de next.config.ts: ambos leen la misma variable.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Antepone la subruta a una ruta absoluta de `/public` (`<img>`, `next/image` con `unoptimized`, CSS). */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * `NEXT_PUBLIC_NOINDEX=1` solo en el build de GitHub Pages: el demo es una
 * vista previa privada de la clienta y Pages no permite contraseña. Los builds
 * locales y de Lighthouse siguen indexables (decisión de Rafa, regla 13).
 */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";

/** Ruta de `/public` para la imagen Open Graph. Los metadatos la componen con `metadataBase`, que ya incluye la subruta. */
export const OG_IMAGE = "/placeholders/hero-edicion-clean-1280.webp";
