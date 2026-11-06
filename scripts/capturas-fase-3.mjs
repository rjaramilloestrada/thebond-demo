/**
 * Capturas de la Fase 3 a 390 y 1440 px (2x, ≤ 8000 px de alto cada una) en
 * docs/capturas/fase-3/. Corre contra `npm run start`:
 *
 *   BASE_URL=http://localhost:3000 node scripts/capturas-fase-3.mjs
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

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "docs/capturas/fase-3";
mkdirSync(OUT, { recursive: true });
const SLICE = 3000; // alto CSS máximo por imagen (×2 = 6000 px)

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
const CEDULA_BAD = `${CEDULA_OK.slice(0, 9)}${(Number(CEDULA_OK[9]) + 1) % 10}`;

const browser = await chromium.launch();

async function open(width, flags = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(
    (value) =>
      localStorage.setItem(
        "thebond-demo-flags",
        JSON.stringify({ state: { forcePaymentDecline: false, forceSoldOut: false, fastReservationTimer: false, simulateLiveSales: false, ...value }, version: 1 }),
      ),
    flags,
  );
  await page.goto(`${BASE}/ediciones/the-power-hour`);
  await page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]:not([disabled])').waitFor();
  return { context, page };
}

async function choose(page) {
  const a = page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
  const b = page.locator('[data-testid="ticket-type-tt-002-b"] button[aria-label="Más"]');
  await a.click();
  await a.click();
  await b.click();
}

async function fillDatos(page, taxId) {
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  for (let i = 0; i < 3; i++) {
    await page.fill(`#att-${i}-name`, `Asistente ${String(i + 1).padStart(2, "0")}`);
    await page.fill(`#att-${i}-email`, `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`);
    await page.selectOption(`#att-${i}-f-af-002-talla`, ["S", "M", "L"][i]);
  }
  await page.fill("#taxid", taxId);
  await page.locator("#taxid").blur();
}

/** Captura el alto completo de la página (o de un elemento) en trozos de ≤ SLICE px CSS. */
async function shoot(page, name, width, opts = {}) {
  const { selector, viewportOnly } = opts;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  if (viewportOnly) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}-${width}-01.png` });
    return;
  }
  // Las secciones con min-h-svh cambian de alto con el viewport: se mide ya con el viewport final
  let top = 0;
  let height = await page.evaluate(() => document.documentElement.scrollHeight);
  let parts = Math.max(1, Math.ceil(height / SLICE));
  let partHeight = Math.ceil(height / parts);
  await page.setViewportSize({ width, height: Math.min(partHeight, SLICE) });
  await page.waitForTimeout(400);
  if (selector) {
    const box = await page.locator(selector).boundingBox();
    top = Math.round(box.y + (await page.evaluate(() => window.scrollY)));
    height = Math.round(box.height);
    parts = Math.max(1, Math.ceil(height / SLICE));
    partHeight = Math.ceil(height / parts);
    await page.setViewportSize({ width, height: Math.min(partHeight, SLICE) });
    await page.waitForTimeout(400);
    const again = await page.locator(selector).boundingBox();
    top = Math.round(again.y + (await page.evaluate(() => window.scrollY)));
  }
  for (let i = 0; i < parts; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top + i * partHeight);
    await page.waitForTimeout(1600); // revelados de titulares
    await page.screenshot({ path: `${OUT}/${name}-${width}-${String(i + 1).padStart(2, "0")}.png` });
  }
  await page.setViewportSize({ width, height: 900 });
}

for (const width of [390, 1440]) {
  // 1. Selector con cupón
  {
    const { context, page } = await open(width);
    await choose(page);
    await page.fill("#cupon", "bond10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.locator('[data-testid="cupon-ok"]').waitFor();
    await shoot(page, "selector-con-cupon", width, { selector: "#entradas" });
    await context.close();
  }
  // 2. Datos con error de cédula + 3. Caja de pagos + 4. Rechazo
  {
    const { context, page } = await open(width, { forcePaymentDecline: true });
    await choose(page);
    await page.fill("#cupon", "bond10");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.locator('[data-testid="cupon-ok"]').waitFor();
    await page.locator('[data-testid="continuar"]').click();
    await page.waitForURL(/\/comprar\/ord-/);
    await page.locator("#buyer-name").waitFor();
    await fillDatos(page, CEDULA_BAD);
    await page.locator("#taxid-error").waitFor();
    await shoot(page, "datos-error-cedula", width);
    await page.fill("#taxid", CEDULA_OK);
    await page.getByRole("button", { name: /Ir a pagar/ }).click();
    await page.waitForURL(/paso=pago/);
    await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
    await shoot(page, "caja-de-pagos", width);
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await page.locator('[data-testid="pago-rechazado"]').waitFor();
    await shoot(page, "pago-rechazado", width);
    await context.close();
  }
  // 5. Reserva vencida (modal)
  {
    const { context, page } = await open(width, { fastReservationTimer: true });
    await choose(page);
    await page.locator('[data-testid="continuar"]').click();
    await page.waitForURL(/\/comprar\/ord-/);
    await page.locator("dialog[open]").waitFor({ timeout: 45_000 });
    await shoot(page, "reserva-vencida", width, { viewportOnly: true });
    await context.close();
  }
  // 6. Confirmación con tickets (después de imprimir)
  {
    const { context, page } = await open(width);
    await choose(page);
    await page.locator('[data-testid="continuar"]').click();
    await page.waitForURL(/\/comprar\/ord-/);
    await page.locator("#buyer-name").waitFor();
    await fillDatos(page, CEDULA_OK);
    await page.getByRole("button", { name: /Ir a pagar/ }).click();
    await page.waitForURL(/paso=pago/);
    await page.getByRole("button", { name: /^Pagar/ }).click();
    await page.waitForURL(/confirmacion/);
    await page.locator('[data-testid="printed-ticket"]').first().waitFor();
    await page.waitForFunction(() => document.querySelectorAll('img[data-testid="ticket-qr"]').length === 3);
    await page.waitForTimeout(5000);
    await shoot(page, "confirmacion-tickets", width);
    await context.close();
  }
  console.log(`listo ${width}`);
}
await browser.close();
