/**
 * Lee los colores de `src/styles/tokens.css` (única fuente de color). Los correos
 * necesitan valores literales (los clientes de correo no entienden variables CSS),
 * así que `scripts/generate-email-theme.mjs` usa esta función para generar
 * `generated/email-theme.json` y un test comprueba que no se desfase.
 */
export const BRAND_COLORS = ["olive", "moss", "cream", "sand", "ember", "sun", "night", "butter"] as const;
export type BrandColor = (typeof BRAND_COLORS)[number];
export type EmailPalette = Record<BrandColor, string>;

export function parseColorTokens(css: string): EmailPalette {
  const found: Record<string, string> = {};
  for (const m of css.matchAll(/--bond-([a-z]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) found[m[1]] = m[2].toLowerCase();
  const missing = BRAND_COLORS.filter((c) => !found[c]);
  if (missing.length) throw new Error(`tokens.css no define: ${missing.join(", ")}`);
  return Object.fromEntries(BRAND_COLORS.map((c) => [c, found[c]])) as EmailPalette;
}
