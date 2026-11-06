/**
 * Vectoriza los logos oficiales de THE BOND (JPG 1080x1080 en assets/brand/,
 * crema sobre oliva) a SVG de un solo trazo relleno con currentColor y sin fondo.
 *
 * Pasos: gris -> recorte al bounding box del logo (con margen pequeño) -> escala
 * 3x (lanczos) -> potrace (umbral fijo a mitad entre fondo y logo, así se
 * conservan los huecos del entrelazado B/O) -> SVG con currentColor.
 *
 * Los SVG van a src/components/brand/svg/ y los consumen Monogram.tsx y Logo.tsx
 * (que incrustan el path inline, sin petición de imagen). Los JPG originales
 * siguen siendo la fuente de verdad hasta recibir los SVG oficiales.
 *
 * Uso: npm run logos   (o: node scripts/vectorize-logos.mjs [--debug])
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const potrace = require("potrace");

const SCALE = 3; // escala previa al trazado, curvas más suaves
const PAD_RATIO = 0.015; // margen del viewBox respecto al lado mayor del logo
// threshold: fracción entre luminancia de fondo y de logo (0.5 = borde real; menor engrosa los trazos finísimos)

const JOBS = [
  { name: "monogram", src: "assets/brand/monograma-bo-original.jpg", turdSize: 4, optTolerance: 0.6, alphaMax: 1, blur: 1.6, threshold: 0.5 },
  { name: "logo", src: "assets/brand/logo-the-bond-original.jpg", turdSize: 2, optTolerance: 0.2, alphaMax: 1, blur: 0.45, threshold: 0.46 },
];

const root = new URL("../", import.meta.url);
const outDir = new URL("src/components/brand/svg/", root);
mkdirSync(outDir, { recursive: true });

const trace = (buf, params) =>
  new Promise((resolve, reject) => {
    const p = new potrace.Potrace(params);
    p.loadImage(buf, (err) => (err ? reject(err) : resolve(p)));
  });

const paths = {};
for (const job of JOBS) {
  const file = new URL(job.src, root).pathname;
  const { data, info } = await sharp(file).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  // Luminancia de fondo (mediana de las esquinas) y de logo (percentil 99.5).
  const corners = [data[0], data[W - 1], data[(H - 1) * W], data[H * W - 1]].sort((a, b) => a - b);
  const bg = corners[1];
  const sorted = Uint8Array.from(data).sort();
  const fg = sorted[Math.floor(sorted.length * 0.995)];
  const level = Math.round(bg + (fg - bg) * job.threshold);

  // Bounding box del logo.
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[y * W + x] > level) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * PAD_RATIO);
  const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad);
  const cw = Math.min(W, x1 + pad + 1) - left, ch = Math.min(H, y1 + pad + 1) - top;

  const prepared = await sharp(file)
    .grayscale()
    .extract({ left, top, width: cw, height: ch })
    .resize(cw * SCALE, ch * SCALE, { kernel: "lanczos3" })
    .blur(job.blur)
    .png()
    .toBuffer();

  const p = await trace(prepared, {
    threshold: level,
    blackOnWhite: false, // el logo es la parte clara
    turdSize: job.turdSize,
    optTolerance: job.optTolerance,
    alphaMax: job.alphaMax,
    optCurve: true,
  });

  const w = cw * SCALE, h = ch * SCALE;
  const tag = p.getPathTag();
  const d = tag.match(/ d="([^"]+)"/)[1].replace(/-?\d+\.\d+/g, (n) => String(Math.round(parseFloat(n) * 10) / 10));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="currentColor"><path fill-rule="evenodd" d="${d}"/></svg>\n`;
  writeFileSync(new URL(`${job.name}.svg`, outDir), svg);
  paths[job.name] = { width: w, height: h, d };
  console.log(`${job.name}.svg  umbral=${level} (fondo ${bg}, logo ${fg})  viewBox ${w}x${h}  ${(svg.length / 1024).toFixed(1)} KB`);
}

// Módulo TS con los paths, para incrustarlos inline en los componentes (sin petición de imagen).
writeFileSync(
  new URL("paths.ts", outDir),
  `/* GENERADO por scripts/vectorize-logos.mjs (npm run logos). No editar a mano. */\n` +
    Object.entries(paths)
      .map(([k, v]) => `export const ${k}Path = { width: ${v.width}, height: ${v.height}, d: ${JSON.stringify(v.d)} } as const;\n`)
      .join(""),
);
