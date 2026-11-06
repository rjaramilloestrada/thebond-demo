/**
 * Capturas del rediseño "Quiet Bond" a 390 y 1440 px (2x, ≤ 8000 px de alto cada
 * una) en docs/capturas/rediseno/<MODE>/. Mismo conjunto de pantallas antes y después:
 * home, las dos ediciones, el selector (en el rediseño: la hoja de compra abierta),
 * datos, confirmación y mi-entrada.
 *
 *   MODE=antes   BASE_URL=http://localhost:3100 node scripts/capturas-rediseno.mjs   (build del commit 7e6ca39)
 *   MODE=despues BASE_URL=http://localhost:3101 node scripts/capturas-rediseno.mjs   (build nuevo)
 *
 * `BASE_URL` incluye la subruta si la hay. El alto completo se captura con
 * `fullPage` + `clip` por tramos, sin cambiar el viewport (las secciones a
 * pantalla completa conservan su alto real). Antes se recorre la página para que
 * se disparen los revelados.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const spec of ["playwright", "/opt/node-tools/node_modules/playwright"]) {
    try {
      return require(spec);
    } catch {
      /* siguiente */
    }
  }
  throw new Error("No se encontró Playwright");
}
const { chromium } = loadPlaywright();

const MODE = process.env.MODE === "antes" ? "antes" : "despues";
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = `docs/capturas/rediseno/${MODE}`;
mkdirSync(OUT, { recursive: true });
const SLICE = 3600; // alto CSS máximo por imagen (×2 = 7200 px)
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const want = (name) => !ONLY || ONLY.includes(name);

function cedula(first9) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = Number(first9[i]) * (i % 2 === 0 ? 2 : 1);
    if (p > 9) p -= 9;
    sum += p;
  }
  return `${first9}${(10 - (sum % 10)) % 10}`;
}
const CEDULA_OK = cedula("091234567");
const browser = await chromium.launch();

async function open(width, { flags = {}, path = "/ediciones/the-power-hour" } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate((value) => {
    localStorage.setItem(
      "thebond-demo-flags",
      JSON.stringify({ state: { forcePaymentDecline: false, forceSoldOut: false, fastReservationTimer: false, simulateLiveSales: false, ...value }, version: 1 }),
    );
  }, flags);
  await page.goto(`${BASE}${path}`);
  return { context, page };
}

async function settle(page) {
  // Recorre la página para disparar los revelados y vuelve arriba
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => window.innerHeight);
  for (let y = 0; y < h; y += Math.round(vh * 0.6)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
}

/** Captura el alto completo en tramos de ≤ SLICE px CSS. */
async function shoot(page, name, width, { viewportOnly = false } = {}) {
  if (viewportOnly) {
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}-${width}-01.png` });
    return;
  }
  await settle(page);
  // En las capturas de página completa los elementos fijos (barra inferior) se
  // dibujarían a mitad de la página: se ocultan solo para la toma
  await page.addStyleTag({ content: "[data-checkout-bar],[data-sticky-cta]{display:none!important}" });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const parts = Math.max(1, Math.ceil(height / SLICE));
  const partHeight = Math.ceil(height / parts);
  for (let i = 0; i < parts; i++) {
    const y = i * partHeight;
    await page.screenshot({
      path: `${OUT}/${name}-${width}-${String(i + 1).padStart(2, "0")}.png`,
      fullPage: true,
      clip: { x: 0, y, width, height: Math.min(partHeight, height - y) },
    });
  }
}

/** Antes: el selector está en la página. Después: el botón "Get your ticket" abre la hoja. */
async function openSelector(page) {
  if (MODE === "despues") {
    await page.locator('[data-testid="open-sheet"]').first().click();
    await page.locator('[data-testid="purchase-sheet"][open], dialog[open] [data-testid="ticket-type-tt-002-a"]').first().waitFor();
    await page.waitForTimeout(900);
  }
  await page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]:not([disabled])').waitFor();
}

async function choose(page) {
  const a = page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
  const b = page.locator('[data-testid="ticket-type-tt-002-b"] button[aria-label="Más"]');
  await a.click();
  await a.click();
  await b.click();
}

async function fillDatos(page) {
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  await page.fill("#taxid", CEDULA_OK);
  for (let i = 0; i < 3; i++) {
    if (MODE === "despues") {
      // Cada asistente es un bloque colapsable: se abre antes de escribir
      const summary = page.locator(`[data-testid="attendee-${i}"] summary`);
      if (await summary.count()) {
        const open = await page.locator(`[data-testid="attendee-${i}"]`).evaluate((el) => el.hasAttribute("open"));
        if (!open) await summary.click();
      }
    }
    await page.fill(`#att-${i}-name`, `Asistente ${String(i + 1).padStart(2, "0")}`);
    await page.fill(`#att-${i}-email`, `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`);
    await page.selectOption(`#att-${i}-f-af-002-talla`, ["S", "M", "L"][i]);
  }
  await page.locator("#taxid").blur();
}

async function toDatos(page) {
  await openSelector(page);
  await choose(page);
  await page.locator('[data-testid="continuar"]').click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await page.locator("#buyer-name").waitFor();
}

async function buy(page) {
  await toDatos(page);
  await fillDatos(page);
  await page.getByRole("button", { name: /Ir a pagar|Continuar al pago/ }).first().click();
  await page.waitForURL(/paso=pago/);
  await page.getByRole("button", { name: /^Pagar/ }).first().click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll('img[data-testid="ticket-qr"]').length === 3);
  await page.waitForTimeout(5200);
}

for (const width of [390, 1440]) {
  if (want("home")) {
    const { context, page } = await open(width, { path: "/" });
    await page.waitForTimeout(1500);
    await shoot(page, "home", width);
    await context.close();
  }
  if (want("power-hour")) {
    const { context, page } = await open(width);
    await page.waitForTimeout(1500);
    await shoot(page, "power-hour", width);
    await context.close();
  }
  if (want("first-experience")) {
    const { context, page } = await open(width, { path: "/ediciones/the-first-experience" });
    await page.waitForTimeout(1500);
    await shoot(page, "first-experience", width);
    await context.close();
  }
  if (want("selector")) {
    const { context, page } = await open(width);
    await openSelector(page);
    await choose(page);
    if (MODE === "antes") {
      await page.locator("#entradas").scrollIntoViewIfNeeded();
      const box = await page.locator("#entradas").boundingBox();
      const top = Math.round(box.y + (await page.evaluate(() => window.scrollY)));
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${OUT}/selector-${width}-01.png`, fullPage: true, clip: { x: 0, y: top, width, height: Math.min(box.height, 3600) } });
    } else {
      await shoot(page, "selector-hoja", width, { viewportOnly: true });
      // Hoja con cupón desplegado y aplicado
      const toggle = page.locator('[data-testid="cupon-toggle"]');
      if (await toggle.count()) {
        await toggle.click();
        await page.fill("#cupon", "bond10");
        await page.getByRole("button", { name: "Aplicar" }).click();
        await page.locator('[data-testid="cupon-ok"]').waitFor();
        await shoot(page, "selector-hoja-cupon", width, { viewportOnly: true });
      }
    }
    await context.close();
  }
  if (want("datos")) {
    const { context, page } = await open(width);
    await toDatos(page);
    await fillDatos(page);
    await shoot(page, "datos", width);
    await context.close();
  }
  if (want("confirmacion") || want("mi-entrada")) {
    const { context, page } = await open(width);
    await buy(page);
    if (want("confirmacion")) await shoot(page, "confirmacion", width);
    if (want("mi-entrada")) {
      await page.locator('[data-testid="mi-entrada"]').first().click();
      await page.waitForURL(/\/entrada\/\?t=/);
      await page.locator('[data-testid="entrada"]').waitFor();
      await page.waitForTimeout(800);
      await shoot(page, "mi-entrada", width);
    }
    await context.close();
  }
  if (MODE === "despues" && want("pendientes")) {
    // Modo presentación con pendientes visibles (referencia)
    for (const [name, path] of [["home", "/"], ["power-hour", "/ediciones/the-power-hour"]]) {
      const { context, page } = await open(width, { path });
      await page.evaluate(() => {
        const key = "thebond-demo-flags";
        const cur = JSON.parse(localStorage.getItem(key) ?? "{}");
        cur.state = { ...(cur.state ?? {}), showPending: true };
        cur.version = cur.version ?? 1;
        localStorage.setItem(key, JSON.stringify(cur));
      });
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(1500);
      await shoot(page, `${name}-pendientes`, width);
      await context.close();
    }
  }
  console.log(`listo ${width}`);
}
await browser.close();
