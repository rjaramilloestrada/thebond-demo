import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ColorToken {
  /** "olive" */
  name: string;
  /** "--bond-olive" */
  variable: string;
  hex: string;
}

/**
 * Lee los colores directamente de src/styles/tokens.css para que la página
 * /tokens muestre siempre el valor real (única fuente de color).
 */
export function readColorTokens(): ColorToken[] {
  const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
  const tokens: ColorToken[] = [];
  for (const m of css.matchAll(/--bond-([a-z]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens.push({ name: m[1], variable: `--bond-${m[1]}`, hex: m[2].toLowerCase() });
  }
  return tokens;
}
