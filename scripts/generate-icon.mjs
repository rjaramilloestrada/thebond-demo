/**
 * Genera el ícono del sitio (src/app/icon.png, 64x64) con el monograma BO real
 * (src/components/brand/svg/monogram.svg, de `npm run logos`) y los colores de
 * src/styles/tokens.css: monograma butter sobre night, esquinas redondeadas.
 * Se dibuja grande (512) y se reduce para que siga legible a 32 px.
 * [[PENDIENTE: SVG vectorial oficial del monograma]]
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const token = (name) => css.match(new RegExp(`--bond-${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const night = token("night");
const butter = token("butter");

const mono = readFileSync(new URL("../src/components/brand/svg/monogram.svg", import.meta.url), "utf8");
const [, vw, vh] = mono.match(/viewBox="0 0 (\d+) (\d+)"/);
const d = mono.match(/ d="([^"]+)"/)[1];

const SIZE = 512;
const STROKE = 6; // engrosa un poco el trazo (px en 512) para que aguante a 32 px sin cerrar el hueco del entrelazado
const w = SIZE * 0.78; // ancho del monograma dentro del ícono
const k = w / Number(vw);
const h = Number(vh) * k;
const x = (SIZE - w) / 2;
const y = (SIZE - h) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 0.16}" fill="${night}"/>
  <path transform="translate(${x} ${y}) scale(${k})" fill="${butter}" stroke="${butter}" stroke-width="${STROKE / k}" stroke-linejoin="round" fill-rule="evenodd" d="${d}"/>
</svg>`;

await sharp(Buffer.from(svg)).resize(64, 64, { kernel: "lanczos3" }).png().toFile(new URL("../src/app/icon.png", import.meta.url).pathname);
console.log("src/app/icon.png generado");
