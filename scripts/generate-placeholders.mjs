/**
 * Genera los placeholders de imagen (brief 4.4) en /public/placeholders:
 * bloques con gradiente en los colores de la marca y grano. Sin personas, sin
 * stock, sin imágenes de Instagram. Cada asset sale en dos variantes:
 *   - LIMPIA  (`<nombre>-clean-<ancho>.<fmt>`): gradiente + grano, sin texto. Es la
 *     que se ve por defecto (modo presentación apagado).
 *   - ROTULADA (`<nombre>-<ancho>.<fmt>`): con el nombre del asset y su
 *     `[[PENDIENTE: ...]]`. Solo se ve con "Mostrar pendientes" encendido.
 *
 * Los colores se leen de src/styles/tokens.css (única fuente de color).
 * Salida: AVIF + WebP en 640 / 1280 / 1920 px de ancho + un manifest JSON.
 *
 * Uso: npm run placeholders
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "placeholders");

/* ───────── Tokens de color ───────── */
const css = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const color = {};
for (const m of css.matchAll(/--bond-([a-z]+):\s*(#[0-9a-fA-F]{6})/g)) color[m[1]] = m[2];
for (const k of ["olive", "moss", "cream", "sand", "ember", "sun", "night", "butter"]) {
  if (!color[k]) throw new Error(`Falta --bond-${k} en tokens.css`);
}

/* ───────── Assets ───────── */
const pad = (n) => String(n).padStart(2, "0");
const assets = [
  { name: "hero-edicion", ratio: [16, 9], style: "sunset", pending: "foto de clase en ONNA" },
  { name: "portada-edicion", ratio: [4, 5], style: "olive", pending: "foto de portada de la edición" },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({
    name: `galeria-001-${pad(n)}`,
    ratio: n % 3 === 0 ? [1, 1] : [4, 5],
    style: ["olive", "sand", "moss", "sand", "olive", "moss"][n - 1],
    pending: `foto ${n} de la ed. 001 en alta resolución`,
  })),
  { name: "sede-onna", ratio: [3, 2], style: "moss", pending: "foto o mapa estático de la sede" },
  ...[1, 2, 3].map((n) => ({
    name: `speaker-${pad(n)}`,
    ratio: [4, 5],
    style: ["olive", "ember", "moss"][n - 1],
    pending: `foto del speaker o coach ${n}`,
  })),
  { name: "logo-marca-fit101", ratio: [3, 2], style: "cream", pending: "logo de FIT101 (permiso y archivo)", label: "FIT101" },
  ...[1, 2, 3].map((n) => ({
    name: `logo-marca-${pad(n)}`,
    ratio: [3, 2],
    style: ["cream", "sand", "cream"][n - 1],
    pending: `logo de la marca aliada ${n} (permiso y archivo)`,
    label: "@usuario",
  })),
];

const WIDTHS = [640, 1280, 1920];

/* ───────── Utilidades ───────── */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isLight = (style) => ["cream", "sand"].includes(style);

function background(style, w, h) {
  const g = (id, stops, extra = "") =>
    `<linearGradient id="${id}" ${extra}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  switch (style) {
    case "sunset":
      return `<defs>
        ${g("sky", [[0, color.night], [0.45, color.night], [1, color.moss]], 'x1="0" y1="0" x2="0" y2="1"')}
        <radialGradient id="sun" cx="50%" cy="82%" r="75%">
          <stop offset="0" stop-color="${color.butter}"/>
          <stop offset="0.16" stop-color="${color.sun}"/>
          <stop offset="0.42" stop-color="${color.ember}"/>
          <stop offset="1" stop-color="${color.night}" stop-opacity="0"/>
        </radialGradient></defs>
        <rect width="${w}" height="${h}" fill="url(#sky)"/><rect width="${w}" height="${h}" fill="url(#sun)"/>`;
    case "ember":
      return `<defs><radialGradient id="e" cx="30%" cy="85%" r="95%">
          <stop offset="0" stop-color="${color.sun}"/><stop offset="0.45" stop-color="${color.ember}"/><stop offset="1" stop-color="${color.night}"/>
        </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#e)"/>`;
    case "night":
      return `<defs><radialGradient id="n" cx="50%" cy="100%" r="90%">
          <stop offset="0" stop-color="${color.ember}"/><stop offset="0.35" stop-color="${color.night}"/><stop offset="1" stop-color="${color.night}"/>
        </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#n)"/>`;
    case "moss":
      return `<defs>${g("m", [[0, color.moss], [1, color.night]], 'x1="0" y1="0" x2="1" y2="1"')}</defs><rect width="${w}" height="${h}" fill="url(#m)"/>`;
    case "sand":
      return `<defs>${g("s", [[0, color.cream], [1, color.sand]], 'x1="0" y1="0" x2="0" y2="1"')}</defs><rect width="${w}" height="${h}" fill="url(#s)"/>`;
    case "cream":
      return `<rect width="${w}" height="${h}" fill="${color.cream}"/>`;
    case "olive":
    default:
      return `<defs><radialGradient id="o" cx="70%" cy="20%" r="95%">
          <stop offset="0" stop-color="${color.olive}"/><stop offset="1" stop-color="${color.moss}"/>
        </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#o)"/>`;
  }
}

function labelSvg(asset, w, h) {
  const light = isLight(asset.style);
  const ink = light ? color.night : color.cream;
  const accent = light ? color.olive : color.butter;
  const u = w / 100; // unidad relativa
  const pad = 5 * u;
  const lines = [];
  // marca de tienda: THE BOND
  lines.push(
    `<text x="${pad}" y="${pad + 1.6 * u}" font-family="DejaVu Sans, Inter, sans-serif" font-size="${1.5 * u}" letter-spacing="${0.45 * u}" fill="${accent}" font-weight="600">THE  BOND</text>`,
  );
  if (asset.label) {
    lines.push(
      `<text x="${w / 2}" y="${h / 2 + 2.6 * u}" text-anchor="middle" font-family="DejaVu Serif, Georgia, serif" font-size="${8 * u}" fill="${ink}">${esc(asset.label)}</text>`,
    );
  }
  const nameSize = asset.label ? 2.2 * u : 3.6 * u;
  const pendSize = asset.label ? 1.8 * u : 2.4 * u;
  const baseY = h - pad - pendSize * 1.5;
  lines.push(
    `<text x="${pad}" y="${baseY}" font-family="DejaVu Sans Mono, monospace" font-size="${nameSize}" fill="${ink}">${esc(asset.name)}</text>`,
    `<text x="${pad}" y="${baseY + pendSize * 1.7}" font-family="DejaVu Sans, Inter, sans-serif" font-size="${pendSize}" fill="${accent}">${esc(`[[PENDIENTE: ${asset.pending}]]`)}</text>`,
  );
  // marco fino
  lines.push(
    `<rect x="${1.6 * u}" y="${1.6 * u}" width="${w - 3.2 * u}" height="${h - 3.2 * u}" fill="none" stroke="${ink}" stroke-opacity="0.35" stroke-width="${0.15 * u}"/>`,
  );
  return lines.join("");
}

/**
 * Variante limpia: sobre el gradiente base, formas orgánicas muy desenfocadas
 * (como sombras de hojas y luz baja), con la paleta de la marca. Sin texto y sin
 * personas; da profundidad sin fingir una foto.
 */
function organic(style, w, h, seed) {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const light = isLight(style);
  const lights = light ? [color.sand, color.butter] : [color.sand, color.butter, color.sun];
  const darks = light ? [color.olive, color.moss] : [color.night, color.moss];
  const blobs = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const isLightBlob = i % 3 === 0;
    const pal = isLightBlob ? lights : darks;
    const c = pal[Math.floor(rand() * pal.length)];
    const cx = (0.1 + rand() * 0.8) * w;
    const cy = (0.05 + rand() * 0.9) * h;
    const rx = (0.12 + rand() * 0.22) * w;
    const ry = rx * (1.6 + rand() * 1.4);
    const rot = -70 + rand() * 140;
    const op = isLightBlob ? (light ? 0.35 : 0.1 + rand() * 0.1) : light ? 0.1 + rand() * 0.08 : 0.22 + rand() * 0.18;
    blobs.push(`<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})" fill="${c}" fill-opacity="${op.toFixed(2)}"/>`);
  }
  const blur = Math.max(w, h) * 0.045;
  return `<defs><filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur.toFixed(1)}"/></filter></defs><g filter="url(#bl)">${blobs.join("")}</g>`;
}

/** Viñeta suave: centra la luz y da profundidad a la variante limpia (sin texto). */
function vignette(w, h) {
  return `<defs><radialGradient id="vg" cx="50%" cy="46%" r="78%">
      <stop offset="0.55" stop-color="${color.night}" stop-opacity="0"/>
      <stop offset="1" stop-color="${color.night}" stop-opacity="0.28"/>
    </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#vg)"/>`;
}

function grainBuffer(w, h, seed) {
  const rand = mulberry32(seed);
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.floor(rand() * 256);
    buf[i * 4] = v;
    buf[i * 4 + 1] = v;
    buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = Math.floor(10 + rand() * 22); // alfa baja: grano sutil
  }
  return buf;
}

/* ───────── Generación ───────── */
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const manifest = [];

for (const asset of assets) {
  const [rw, rh] = asset.ratio;
  const seed = hashString(asset.name);
  const variants = [];
  for (const width of WIDTHS) {
    const height = Math.round((width * rh) / rw);
    for (const variant of ["labeled", "clean"]) {
      const inner =
        variant === "labeled"
          ? `${background(asset.style, width, height)}${labelSvg(asset, width, height)}`
          : `${background(asset.style, width, height)}${organic(asset.style, width, height, seed)}${isLight(asset.style) ? "" : vignette(width, height)}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${inner}</svg>`;
      const base = await sharp(Buffer.from(svg))
        .composite([{ input: grainBuffer(width, height, seed + width), raw: { width, height, channels: 4 }, blend: "overlay" }])
        .removeAlpha()
        .toBuffer();
      const stem = variant === "clean" ? `${asset.name}-clean` : asset.name;
      for (const format of ["avif", "webp"]) {
        const file = `${stem}-${width}.${format}`;
        const pipeline = sharp(base);
        if (format === "avif") await pipeline.avif({ quality: 42, effort: 4 }).toFile(join(outDir, file));
        else await pipeline.webp({ quality: 72 }).toFile(join(outDir, file));
      }
    }
    variants.push({ width, height });
  }
  manifest.push({
    name: asset.name,
    pending: `[[PENDIENTE: ${asset.pending}]]`,
    aspect: `${rw}/${rh}`,
    widths: variants,
  });
  console.log(`✓ ${asset.name} (rotulada + limpia)`);
}

const manifestPath = join(root, "src/lib/placeholders.manifest.json");
writeFileSync(manifestPath, JSON.stringify({ widths: WIDTHS, assets: manifest }, null, 2) + "\n");
console.log(`\n${manifest.length} assets · manifest en src/lib/placeholders.manifest.json`);
