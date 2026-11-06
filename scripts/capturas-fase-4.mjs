/**
 * Capturas de la Fase 4 a 390 y 1440 px (2x, ≤ 8000 px de alto cada una) en
 * docs/capturas/fase-4/. Corre contra un servidor del export estático (ver e2e-fase-4.mjs;
 * BASE_URL incluye la subruta si la hay):
 *
 *   BASE_URL=http://localhost:3000 node scripts/capturas-fase-4.mjs
 */
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
const { build } = await import("rolldown");

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "docs/capturas/fase-4";
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


/** Compra por la interfaz hasta la confirmación (3 entradas: 2 + 1). */
async function buy(page) {
  await choose(page);
  await page.locator('[data-testid="continuar"]').click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await page.locator("#buyer-name").waitFor();
  await fillDatos(page, CEDULA_OK);
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  await page.locator('a[data-testid="ver-correo"]').waitFor();
  await page.locator('a[data-testid="ver-factura"]').waitFor();
}

async function waitEmail(page) {
  await page.getByText("Vista previa · este correo no se envía").waitFor();
  const handle = await page.locator('[data-testid="correo-iframe"]').elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForLoadState("load");
  await frame.locator("img").first().waitFor();
  await page.waitForTimeout(800);
}

/** order-service real empaquetado para la página (ver scripts/e2e-fase-4.mjs, caso de la lista de espera). */
async function bundleOrderService() {
  const dir = mkdtempSync(join(tmpdir(), "bond-cap-"));
  const entry = join(dir, "entry.ts");
  writeFileSync(
    entry,
    `import { useDbStore } from "@/store/db-store";
import { cancelOrder } from "@/services/order-service";
(globalThis as any).__cap = {
  async cancelOrder(orderId: string) {
    await useDbStore.persist.rehydrate();
    const r = await cancelOrder(orderId, { refund: true });
    if (r.ok) await r.followUps;
    return r.ok;
  },
};
`,
  );
  const out = join(dir, "bundle.js");
  await build({
    input: entry,
    platform: "browser",
    resolve: { alias: { "@": [fileURLToPath(new URL("../src", import.meta.url))] } },
    transform: { define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_MOCK_LATENCY": '"0"' } },
    output: { file: out, format: "iife" },
    logLevel: "silent",
  });
  return readFileSync(out, "utf8");
}

for (const width of [390, 1440]) {
  // 1. Correo de entrada + 2. Factura RIDE + 3. Recordatorio
  {
    const { context, page } = await open(width);
    await buy(page);
    await page.locator('a[data-testid="ver-correo"]').click();
    await page.waitForURL(/\/correo\//);
    await waitEmail(page);
    await shoot(page, "correo-entrada", width);
    await page.goBack();
    await page.locator('a[data-testid="ver-factura"]').click();
    await page.waitForURL(/\/factura\//);
    await page.locator('[data-testid="ride"]').waitFor();
    await shoot(page, "factura-ride", width);
    await page.goBack();
    await page.locator('[data-testid="ver-recordatorio"]').click();
    await page.waitForURL(/\/correo\//);
    await waitEmail(page);
    await shoot(page, "recordatorio", width);
    await context.close();
  }
  // 4. Mi entrada + 5. Transferencia (modal) + 6. Entrada inválida (QR anterior)
  {
    const { context, page } = await open(width);
    await buy(page);
    await page.locator('[data-testid="mi-entrada"]').first().click();
    await page.waitForURL(/\/entrada\/\?t=/);
    await page.locator('[data-testid="entrada"]').waitFor();
    const oldUrl = page.url();
    await page.waitForTimeout(600);
    await shoot(page, "mi-entrada", width);
    await page.fill("#transfer-name", "Asistente Nueva");
    await page.fill("#transfer-email", "nueva@ejemplo.com");
    await page.locator('[data-testid="transfer-enviar"]').click();
    await page.locator("dialog[open]").waitFor();
    await shoot(page, "transferencia", width, { viewportOnly: true });
    await page.locator('[data-testid="transfer-confirmar"]').click();
    await page.locator('[data-testid="transfer-ok"]').waitFor();
    await page.waitForTimeout(600);
    await shoot(page, "transferencia-hecha", width);
    await page.goto(oldUrl);
    await page.locator('[data-testid="entrada-invalida"]').waitFor();
    await page.waitForTimeout(600);
    await shoot(page, "entrada-invalida", width, { viewportOnly: true });
    await context.close();
  }
  // 7. Correo de lista de espera (edición agotada → cancelar una orden)
  {
    const { context, page } = await open(width);
    await buy(page);
    const orderId = new URL(page.url()).searchParams.get("orden");
    await page.evaluate(
      (value) =>
        localStorage.setItem(
          "thebond-demo-flags",
          JSON.stringify({ state: { forcePaymentDecline: false, forceSoldOut: true, fastReservationTimer: false, simulateLiveSales: false, ...value }, version: 1 }),
        ),
      {},
    );
    await page.goto(`${BASE}/ediciones/the-power-hour`);
    const submit = page.getByRole("button", { name: /Avísame si se libera un cupo/ }).first();
    await submit.waitFor();
    const form = page.locator("form", { has: submit }).first();
    await form.getByLabel("Nombre").fill("Lista de espera 03");
    await form.getByLabel("Correo").fill("espera03@ejemplo.com");
    await submit.click();
    await page.getByText("Estás en la").first().waitFor();
    await page.addScriptTag({ content: await bundleOrderService() });
    await page.evaluate((id) => window.__cap.cancelOrder(id), orderId);
    const mailId = await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem("thebond-demo")).state;
      return Object.values(st.emails).find((e) => e.template === "waitlist-available")?.id;
    });
    await page.goto(`${BASE}/correo/?id=${mailId}`);
    await waitEmail(page);
    await shoot(page, "correo-lista-espera", width);
    await context.close();
  }
  console.log(`listo ${width}`);
}
await browser.close();
