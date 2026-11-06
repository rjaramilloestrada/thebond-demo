/**
 * Genera `generated/email-theme.json` a partir de `src/styles/tokens.css`.
 * Los correos necesitan colores literales; así ningún hex vive fuera de tokens.css
 * dentro de `src/`. Se ejecuta solo en `predev`, `prebuild` y `pretest`
 * (`npm run email-theme`). El JSON generado se versiona; el test
 * `src/emails/theme.test.ts` falla si se desfasa de tokens.css.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const { parseColorTokens } = await import(fileURLToPath(new URL("../src/emails/parse-tokens.ts", import.meta.url)));

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const palette = parseColorTokens(css);
mkdirSync(new URL("../generated/", import.meta.url), { recursive: true });
const next = `${JSON.stringify(palette, null, 2)}\n`;
const target = new URL("../generated/email-theme.json", import.meta.url);
let current = "";
try {
  current = readFileSync(target, "utf8");
} catch {
  /* primera vez */
}
if (current !== next) {
  writeFileSync(target, next);
  console.log("generated/email-theme.json actualizado");
}
