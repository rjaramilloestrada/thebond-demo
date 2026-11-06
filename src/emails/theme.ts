/**
 * Tema de los correos. Los clientes de correo necesitan colores literales, pero
 * la única fuente de color es `src/styles/tokens.css`: `generated/email-theme.json`
 * lo genera `scripts/generate-email-theme.mjs` (predev, prebuild, pretest) y
 * `theme.test.ts` comprueba que no se desfase. Aquí no hay ningún hex.
 */
import palette from "../../generated/email-theme.json";
import type { EmailPalette } from "./parse-tokens";

export const color: EmailPalette = palette;

/** Pilas de fuentes seguras para correo (Bodoni Moda e Inter se cargan donde el cliente lo permite). */
export const font = {
  display: "'Bodoni Moda', 'Bodoni 72', Didot, 'Playfair Display', Georgia, 'Times New Roman', serif",
  label: "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  body: "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;

/** Hoja de Google Fonts opcional (Apple Mail y otros la respetan; el resto usa las pilas de arriba). */
export const FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@600&family=Bodoni+Moda:ital,opsz@0,6..96;1,6..96&family=Inter:wght@400;500&display=swap";

export const WIDTH = 600;
