/**
 * E2E de la Fase 3 (flujo de compra), un caso por criterio de "Compra" del brief
 * (sección 8). Corre a 390 px contra un servidor que sirva el export (`npx serve out`,
 * o la carpeta `out` copiada bajo `/thebond-demo/` para el build de Pages). Si el sitio
 * está bajo una subruta, va incluida en BASE_URL:
 *
 *   BASE_URL=http://localhost:3000 node scripts/e2e-fase-3.mjs
 *   BASE_URL=http://localhost:4173/thebond-demo node scripts/e2e-fase-3.mjs
 *
 * Playwright viene preinstalado en el entorno (no se instala aquí). Para
 * decodificar los QR se usan `jsqr` y `pngjs` (devDependencies). Los tokens se
 * verifican con la función real `verifyTicketToken` de `src/domain` (Node 22
 * importa el .ts quitando los tipos).
 */
import { createRequire } from "node:module";
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
const jsQR = require("jsqr");
const { PNG } = require("pngjs");
const { verifyTicketToken } = await import(fileURLToPath(new URL("../src/domain/ticket-token.ts", import.meta.url)));

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EDITION = `${BASE}/ediciones/the-power-hour`;
const FLAGS_KEY = "thebond-demo-flags";
const DB_KEY = "thebond-demo";

/* ───────── utilidades ───────── */

function check(cond, message) {
  if (!cond) throw new Error(message);
}

/** Cédula válida (provincia 09) calculada con el módulo 10 */
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
const RUC_OK = `${CEDULA_OK}001`;
const CEDULA_BAD = `${CEDULA_OK.slice(0, 9)}${(Number(CEDULA_OK[9]) + 1) % 10}`;
const RUC_12 = RUC_OK.slice(0, 12);

const browser = await chromium.launch();
const pageErrors = [];

async function newPage(flags = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`console: ${m.text()}`);
  });
  await page.goto(`${BASE}/`);
  await setFlags(page, flags);
  await page.goto(EDITION);
  await waitSelectorReady(page);
  return { context, page };
}

/** Escribe los interruptores de demo en la forma que persiste zustand */
async function setFlags(page, flags) {
  await page.evaluate(
    ([key, value]) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          state: { forcePaymentDecline: false, forceSoldOut: false, fastReservationTimer: false, simulateLiveSales: false, ...value },
          version: 1,
        }),
      ),
    [FLAGS_KEY, flags],
  );
}

/** Espera a que el selector esté hidratado (botones habilitados) */
async function waitSelectorReady(page) {
  await page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const b = document.querySelector('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
    return b && !b.disabled;
  });
}

async function plus(page, typeId, times) {
  const btn = page.locator(`[data-testid="ticket-type-${typeId}"] button[aria-label="Más"]`);
  await btn.scrollIntoViewIfNeeded();
  for (let i = 0; i < times; i++) await btn.click();
}

async function seatsLeft(page) {
  const text = await page.locator('[role="status"].sr-only', { hasText: "Quedan" }).first().textContent();
  const m = /Quedan (\d+) de/.exec(text ?? "");
  check(m, `No se pudo leer el contador de cupos: ${text}`);
  return Number(m[1]);
}

async function fillDatos(page, attendees, taxId = CEDULA_OK) {
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  for (let i = 0; i < attendees; i++) {
    await page.fill(`#att-${i}-name`, `Asistente ${String(i + 1).padStart(2, "0")}`);
    await page.fill(`#att-${i}-email`, `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`);
    await page.selectOption(`#att-${i}-f-af-002-talla`, ["S", "M", "L", "XL"][i % 4]);
  }
  await page.fill("#taxid", taxId);
}

async function goToPayment(page) {
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
}

async function readDb(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.state ?? null, DB_KEY);
}

function decodeQr(dataUrl) {
  const png = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

/* ───────── criterios ───────── */

async function c1ThreeScreens() {
  const { context, page } = await newPage();
  const urls = [new URL(page.url())]; // pantalla 1: la edición, ya abierta
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) urls.push(new URL(f.url()));
  });
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-[^&]+$/);
  await fillDatos(page, 2);
  await goToPayment(page);
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  const screens = [];
  for (const u of urls) {
    const key = u.pathname + u.search;
    if (key.includes("/comprar/confirmacion")) break;
    if (screens.at(-1) !== key) screens.push(key);
  }
  check(screens.length <= 3, `Se usaron ${screens.length} pantallas antes de pagar: ${screens.join(" → ")}`);
  check(screens.length === 3, `Se esperaban 3 pantallas (edición → datos → pago): ${screens.join(" → ")}`);
  check(screens[0].includes("/ediciones/"), "La primera pantalla debería ser la edición");
  await context.close();
  return `pantallas hasta pagar: ${screens.map((s) => s.replace(/ord-[a-z0-9]+/, "ord-…")).join(" → ")}`;
}

async function c2TypesAndStages() {
  const { context, page } = await newPage();
  const types = page.locator('[data-testid^="ticket-type-"]');
  const count = await types.count();
  check(count >= 2, `Se esperaban ≥ 2 tipos de entrada, hay ${count}`);
  for (let i = 0; i < count; i++) {
    const type = types.nth(i);
    const stages = type.locator("ol > li");
    check((await stages.count()) === 3, `El tipo ${i + 1} no tiene 3 etapas`);
    const labels = (await stages.allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
    const current = type.locator('ol > li[aria-current="step"]');
    check((await current.count()) === 1, `El tipo ${i + 1} debe tener exactamente una etapa activa`);
    const currentText = (await current.textContent()).replace(/\s+/g, " ");
    check(/Preventa/.test(currentText) && /Etapa actual/i.test(currentText), `Etapa activa incorrecta: ${currentText}`);
    check(/Próximamente/i.test(labels[1]) && /Próximamente/i.test(labels[2]), `Las siguientes deben decir Próximamente: ${labels.join(" | ")}`);
  }
  await context.close();
  return `${count} tipos × 3 etapas; activa = Preventa; siguientes = Próximamente`;
}

async function c3Coupon() {
  const { context, page } = await newPage();
  await plus(page, "tt-002-b", 1);
  await page.fill("#cupon", "bond10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  const ok = page.locator('[data-testid="cupon-ok"]');
  await ok.waitFor();
  const okText = (await ok.textContent()).trim();
  check(/−10 %/.test(okText), `El mensaje del cupón debe decir −10 %: ${okText}`);
  const sumCoupon = (await page.locator('[data-testid="summary-coupon"]').textContent()).trim();
  check(sumCoupon === "−10 %", `Línea del cupón: ${sumCoupon}`);
  const total = (await page.locator('[data-testid="summary-total"]').textContent()).trim();
  const sub = (await page.locator('[data-testid="summary-subtotal"]').textContent()).trim();
  check(total === "$XX" && sub === "$XX", `Los montos de ejemplo deben verse $XX (subtotal ${sub}, total ${total})`);
  // El descuento interno es 10 %: se comprueba en la orden reservada
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  const db = await readDb(page);
  const order = Object.values(db.orders).find((o) => o.status === "reserved");
  check(order && order.couponCode === "BOND10", "La orden debe guardar el cupón BOND10");
  check(order.discountCents === Math.round(order.subtotalCents * 0.1), `Descuento interno ${order.discountCents} ≠ 10 % de ${order.subtotalCents}`);
  const sumCouponDatos = (await page.locator('[data-testid="summary-coupon"]').textContent()).trim();
  check(sumCouponDatos === "−10 %", "El resumen de datos debe mostrar el cupón −10 %");

  // Cupón inválido
  await page.goto(EDITION);
  await waitSelectorReady(page);
  await plus(page, "tt-002-a", 1);
  await page.fill("#cupon", "XXXX");
  await page.getByRole("button", { name: "Aplicar" }).click();
  const err = page.locator('[data-testid="cupon-error"]');
  await err.waitFor();
  const errText = (await err.textContent()).trim();
  check(/no existe/i.test(errText), `Mensaje de cupón inválido: ${errText}`);
  check((await page.locator("#cupon").getAttribute("aria-invalid")) === "true", "El campo debe marcar aria-invalid");
  check((await page.locator('[data-testid="summary-coupon"]').count()) === 0, "Un cupón inválido no debe aparecer en el resumen");
  await context.close();
  return `BOND10 → "${okText}" (descuento interno ${order.discountCents} de ${order.subtotalCents}); XXXX → "${errText}"`;
}

async function c4Reservation() {
  const { context, page } = await newPage({ fastReservationTimer: true });
  const before = await seatsLeft(page);
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  const timer = page.locator('[data-testid="timer-clock"]');
  await timer.waitFor();
  const t0 = (await timer.textContent()).trim();
  const [mm0, ss0] = t0.split(":").map(Number);
  check(mm0 * 60 + ss0 <= 30, `Con el temporizador acelerado debería empezar en ≤ 00:30, empezó en ${t0}`);
  await page.waitForTimeout(2200);
  const t1 = (await timer.textContent()).trim();
  const [mm1, ss1] = t1.split(":").map(Number);
  check(mm1 * 60 + ss1 < mm0 * 60 + ss0, `El contador debe correr (${t0} → ${t1})`);

  // Mientras dura la reserva, los cupos están retenidos
  const other = await context.newPage();
  await other.goto(EDITION);
  await other.waitForTimeout(800);
  const held = await seatsLeft(other);
  check(held === before - 2, `Con la reserva activa deberían quedar ${before - 2} cupos, quedan ${held}`);
  await other.close();

  // Vence: aparece el aviso
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor({ timeout: 40_000 });
  const text = (await dialog.textContent()).replace(/\s+/g, " ");
  check(/venció/i.test(text) && /liberamos los cupos/i.test(text), `Texto del aviso: ${text}`);
  check((await dialog.getAttribute("aria-modal")) === "true", "El modal debe declarar aria-modal");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check(/Volver a elegir/.test(focused ?? ""), `El foco debería estar en "Volver a elegir", está en "${focused}"`);

  await page.getByRole("button", { name: "Volver a elegir" }).click();
  await page.waitForURL(/\/ediciones\/the-power-hour/);
  await waitSelectorReady(page);
  await page.waitForFunction(
    (n) => {
      const t = [...document.querySelectorAll('[role="status"].sr-only')].find((e) => /Quedan/.test(e.textContent ?? ""));
      return t && new RegExp(`Quedan ${n} de`).test(t.textContent);
    },
    before,
  );
  const after = await seatsLeft(page);
  check(after === before, `El contador debe recuperarse a ${before}, es ${after}`);
  const db = await readDb(page);
  check(Object.values(db.orders).some((o) => o.status === "expired"), "La orden debe quedar en estado expired");
  await context.close();
  return `cupos ${before} → ${held} (reservados) → ${after} tras vencer; modal con foco en "Volver a elegir"; temporizador ${t0} → ${t1}`;
}

async function c5Validation() {
  const { context, page } = await newPage();
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await page.locator("#buyer-name").waitFor();

  // Un bloque por asistente con los campos configurables
  check((await page.locator('[data-testid^="attendee-"]').count()) === 2, "Debe haber un bloque por asistente (2)");
  for (let i = 0; i < 2; i++) {
    check((await page.locator(`#att-${i}-f-af-002-talla`).count()) === 1, `El asistente ${i + 1} debe pedir la talla`);
    check((await page.locator(`#att-${i}-f-af-002-nivel`).count()) === 1, `El asistente ${i + 1} debe pedir el nivel`);
  }

  // Enviar vacío: errores y foco en el primero
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  check(focusedId === "buyer-name", `El foco debe ir al primer error (buyer-name), está en ${focusedId}`);
  check((await page.locator('#buyer-name[aria-invalid="true"]').count()) === 1, "buyer-name debe tener aria-invalid");
  check((await page.locator("[aria-invalid=true]").count()) >= 7, "Deben marcarse todos los campos obligatorios vacíos");
  check(page.url().includes("paso=pago") === false, "No debe avanzar con datos inválidos");

  async function taxError(value) {
    await page.fill("#taxid", value);
    await page.locator("#taxid").blur();
    const err = page.locator("#taxid-error");
    return (await err.count()) ? (await err.textContent()).trim() : null;
  }
  const rejected = {};
  rejected["123"] = await taxError("123");
  rejected[CEDULA_BAD + " (verificador malo)"] = await taxError(CEDULA_BAD);
  rejected[RUC_12 + " (RUC de 12 dígitos)"] = await taxError(RUC_12);
  for (const [k, v] of Object.entries(rejected)) check(v, `Debía rechazar ${k}`);
  check(/cédula no es válida/i.test(rejected[CEDULA_BAD + " (verificador malo)"]), "Mensaje de cédula inválida");
  const okCedula = await taxError(CEDULA_OK);
  check(okCedula === null, `Debía aceptar la cédula ${CEDULA_OK}: ${okCedula}`);
  check((await page.locator('[data-testid="taxid-kind"]').textContent()).includes("Cédula"), "Debe detectar cédula");
  const okRuc = await taxError(RUC_OK);
  check(okRuc === null, `Debía aceptar el RUC ${RUC_OK}: ${okRuc}`);
  check((await page.locator('[data-testid="taxid-kind"]').textContent()).includes("RUC"), "Debe detectar RUC");

  // "Usar mis datos" copia comprador al asistente 1
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  await page.getByRole("button", { name: "Usar mis datos" }).click();
  check((await page.inputValue("#att-0-name")) === "Comprador Demo", "Usar mis datos debe copiar el nombre");

  // Un asistente sin talla (obligatoria) no deja avanzar
  await page.fill("#att-1-name", "Asistente 02");
  await page.fill("#att-1-email", "asistente02@ejemplo.com");
  await page.selectOption("#att-0-f-af-002-talla", "M");
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  const focus2 = await page.evaluate(() => document.activeElement?.id);
  check(focus2 === "att-1-f-af-002-talla", `Debe enfocar la talla faltante del asistente 2, está en ${focus2}`);
  await page.selectOption("#att-1-f-af-002-talla", "L");
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await context.close();
  return `rechaza 123, ${CEDULA_BAD} y ${RUC_12}; acepta cédula ${CEDULA_OK} y RUC ${RUC_OK}; 2 bloques de asistente con talla y nivel`;
}

async function c6ApprovedQr() {
  const { context, page } = await newPage();
  await plus(page, "tt-002-a", 2);
  await plus(page, "tt-002-b", 1);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await fillDatos(page, 3, RUC_OK);
  await goToPayment(page);
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  check((await page.locator('[data-testid="printed-ticket"]').count()) === 3, "Deben salir 3 tickets");
  await page.waitForFunction(() => document.querySelectorAll('img[data-testid="ticket-qr"]').length === 3);
  await page.waitForTimeout(4500); // termina de "imprimirse"
  const srcs = await page.locator('img[data-testid="ticket-qr"]').evaluateAll((els) => els.map((e) => e.src));
  const tokens = srcs.map(decodeQr);
  check(tokens.every(Boolean), "Algún QR no se pudo decodificar");
  check(new Set(tokens).size === 3, `Los 3 QR deben ser distintos: ${tokens.join(" | ")}`);
  const db = await readDb(page);
  const order = Object.values(db.orders).find((o) => o.status === "paid" && !o.isSeed);
  check(order, "Debe existir la orden pagada");
  const tickets = Object.values(db.tickets).filter((t) => t.orderId === order.id);
  check(tickets.length === 3, "Deben existir 3 tickets guardados");
  const ids = [];
  for (const token of tokens) {
    const parsed = await verifyTicketToken(token);
    check(parsed, `El token no pasa verifyTicketToken: ${token}`);
    check(parsed.version === 1, "La versión inicial debe ser 1");
    ids.push(parsed.ticketId);
  }
  check(ids.sort().join() === tickets.map((t) => t.id).sort().join(), "Los tokens deben corresponder a los tickets de la orden");
  check(order.taxId.kind === "ruc", "La orden debe guardar el RUC como tipo ruc");
  // Ver correo / Ver factura: visibles y deshabilitados
  for (const id of ["ver-correo", "ver-factura"]) {
    const b = page.locator(`[data-testid="${id}"]`);
    check((await b.isVisible()) && (await b.isDisabled()), `${id} debe verse deshabilitado`);
  }
  check(/próxima fase/i.test(await page.locator("#proxima-fase").textContent()), "Debe explicar que llega en la próxima fase");
  // Factura y correos quedan registrados (segundo plano)
  await page.waitForTimeout(4000);
  const db2 = await readDb(page);
  const invoice = Object.values(db2.invoices).find((i) => i.orderId === order.id);
  const emailLogs = Object.values(db2.emails).filter((e) => e.orderId === order.id);
  check(invoice && emailLogs.length === 3, `Factura/correos registrados: factura=${Boolean(invoice)}, correos=${emailLogs.length}`);
  await context.close();
  return `3 QR distintos decodificados → tokens válidos (${ids.join(", ")}); factura ${invoice.number}; ${emailLogs.length} correos registrados`;
}

async function c7Decline() {
  const { context, page } = await newPage({ forcePaymentDecline: true });
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await fillDatos(page, 2);
  await goToPayment(page);
  const orderUrl = page.url();
  await page.getByRole("button", { name: /^Pagar/ }).click();
  const banner = page.locator('[data-testid="pago-rechazado"]');
  await banner.waitFor();
  check(/rechaz/i.test(await banner.textContent()), "El banner debe explicar el rechazo");
  check(page.url() === orderUrl, "No debe salir de la caja de pagos");
  // Reintentar: sigue rechazando y no pierde nada
  await page.getByRole("button", { name: /Reintentar/ }).click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="pagar-barra"]')?.disabled);
  await banner.waitFor();
  // Volver a datos: todo intacto
  await page.getByRole("link", { name: /Volver a mis datos/ }).click();
  await page.waitForURL((u) => !u.search.includes("paso=pago"));
  await page.locator("#buyer-name").waitFor();
  check((await page.inputValue("#buyer-name")) === "Comprador Demo", "Se perdió el nombre del comprador");
  check((await page.inputValue("#att-1-email")) === "asistente02@ejemplo.com", "Se perdió el correo del asistente 2");
  check((await page.inputValue("#taxid")) === CEDULA_OK, "Se perdió la cédula");
  check((await page.inputValue("#att-1-f-af-002-talla")) === "M", "Se perdió la talla del asistente 2");
  let db = await readDb(page);
  check(!Object.values(db.orders).some((o) => o.status === "paid" && !o.isSeed), "La orden no debe pasar a pagada tras el rechazo");
  // Se apaga el interruptor y se recarga (también prueba que el borrador sobrevive a una recarga)
  await setFlags(page, { forcePaymentDecline: false });
  await page.goto(orderUrl);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  db = await readDb(page);
  check(Object.values(db.orders).some((o) => o.status === "paid" && !o.isSeed), "Con el interruptor apagado el pago debe aprobarse");
  await context.close();
  return "rechazo con banner → reintento rechaza y conserva todo → datos intactos (también tras recargar) → flag apagado → aprobado";
}

/* ───────── ejecución ───────── */

const cases = [
  ["Compra en ≤ 3 pantallas (edición → datos → pago)", c1ThreeScreens],
  ["≥ 2 tipos de entrada y 3 etapas, con la activa correcta", c2TypesAndStages],
  ["Cupón BOND10 = −10 %; código inválido = error claro", c3Coupon],
  ["Reserva con contador; al vencer se libera y el contador de cupos se recupera", c4Reservation],
  ["Datos por asistente y cédula/RUC con validación de formato", c5Validation],
  ["Pago aprobado → confirmación con N QR distintos que verifican", c6ApprovedQr],
  ["Pago rechazado → error y reintento sin perder datos", c7Decline],
];

let failed = 0;
for (const [i, [name, fn]] of cases.entries()) {
  const started = Date.now();
  try {
    const detail = await fn();
    console.log(`PASS  C${i + 1}  ${name}\n        ${detail}  (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL  C${i + 1}  ${name}\n        ${e.message}`);
  }
}
await browser.close();
if (pageErrors.length) console.log(`\nAviso: ${pageErrors.length} error(es) de consola/página:\n  ${[...new Set(pageErrors)].join("\n  ")}`);
console.log(`\n${failed === 0 ? "TODOS LOS CRITERIOS PASAN" : `${failed} CRITERIO(S) FALLAN`} (${cases.length - failed}/${cases.length})`);
process.exit(failed === 0 ? 0 : 1);
