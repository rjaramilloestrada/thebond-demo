/**
 * PNG del monograma y del logo para los correos (Gmail no muestra SVG ni data:
 * de forma fiable, así que en correo van como imagen alojada). Parte de los
 * trazos de `src/components/brand/svg/paths.ts` (npm run logos) y de los
 * colores de `generated/email-theme.json`. Salida: `public/email/`.
 *
 *   node scripts/generate-email-assets.mjs     (npm run email-assets)
 */
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const { monogramPath, logoPath } = await import(fileURLToPath(new URL("../src/components/brand/svg/paths.ts", import.meta.url)));
const palette = JSON.parse(readFileSync(new URL("../generated/email-theme.json", import.meta.url), "utf8"));

const OUT = new URL("../public/email/", import.meta.url);
mkdirSync(OUT, { recursive: true });

async function render(shape, color, pixelWidth, file) {
  const height = Math.round((pixelWidth * shape.height) / shape.width);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}" width="${pixelWidth}" height="${height}"><path fill="${color}" fill-rule="evenodd" d="${shape.d}"/></svg>`;
  await sharp(Buffer.from(svg), { density: 300 }).resize(pixelWidth, height).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(file, OUT)));
  console.log(`public/email/${file} ${pixelWidth}×${height}`);
}

// Se muestran a 84 px y 180 px de ancho (2x para pantallas retina)
await render(monogramPath, palette.butter, 168, "monograma-butter.png");
await render(logoPath, palette.cream, 360, "logo-cream.png");
