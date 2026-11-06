/**
 * Genera el ícono provisional del sitio (src/app/icon.png) con los colores de
 * src/styles/tokens.css: anillo butter (la "O" del monograma) sobre night.
 * [[PENDIENTE: monograma BO oficial en SVG]]
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const token = (name) => css.match(new RegExp(`--bond-${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const night = token("night");
const butter = token("butter");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="20" fill="${night}"/>
  <rect x="30" y="30" width="14" height="68" fill="${butter}"/>
  <circle cx="74" cy="64" r="26" fill="none" stroke="${butter}" stroke-width="9"/>
</svg>`;

await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(new URL("../src/app/icon.png", import.meta.url).pathname);
console.log("src/app/icon.png generado");
