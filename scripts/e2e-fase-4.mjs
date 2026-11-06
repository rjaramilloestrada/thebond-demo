/**
 * E2E de la Fase 4 (post compra), un caso por criterio de "Post compra" del brief
 * (sección 8) más las tres comprobaciones de pulido. Corre a 390 px contra un
 * servidor que sirva el export (la carpeta `out` copiada bajo `/thebond-demo/` para
 * el build de Pages). Si el sitio está bajo una subruta, va incluida en BASE_URL:
 *
 *   BASE_URL=http://localhost:4173/thebond-demo node scripts/e2e-fase-4.mjs
 *
 * Playwright viene preinstalado (no se instala aquí). Los QR se decodifican con
 * `jsqr`/`pngjs` y los tokens se verifican con `verifyTicketToken` real.
 *
 * Caso de la lista de espera (P5). La cancelación de una orden aún no tiene
 * pantalla (el botón "Cancelar y reembolsar" llega con `/admin` en la Fase 5), y
 * el sitio no expone ningún gancho de pruebas. El disparador honesto es ejecutar
 * el código REAL de `src/services/order-service.ts` dentro de la página, contra
 * el mismo `localStorage` que usa el sitio: aquí se empaqueta con rolldown (ya
 * viene con vite) en un archivo temporal que NO se versiona ni se publica, se
 * inyecta con `page.addScriptTag` y se recarga la página. Es exactamente la
 * llamada que hará el botón del admin. Antes de inyectar se comprueba que la
 * página publicada no trae ningún gancho (`window.__e2e` indefinido).
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
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
const jsQR = require("jsqr");
const { PNG } = require("pngjs");
const { verifyTicketToken } = await import(fileURLToPath(new URL("../src/domain/ticket-token.ts", import.meta.url)));
const { build } = await import("rolldown");

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EDITION = `${BASE}/ediciones/the-power-hour`;
const FLAGS_KEY = "thebond-demo-flags";
const DB_KEY = "thebond-demo";

/* ───────── utilidades ───────── */

function check(cond, message) {
  if (!cond) throw new Error(message);
}

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
const pageErrors = [];

async function newContext(opts = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...opts });
  // Cuenta las llamadas a window.print (no abre el diálogo del sistema)
  await context.addInitScript(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
    };
  });
  return context;
}

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

async function openEdition(context, flags = {}) {
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`console: ${m.text()}`);
  });
  await page.goto(`${BASE}/`);
  await setFlags(page, flags);
  await page.goto(EDITION);
  await page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const b = document.querySelector('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
    return b && !b.disabled;
  });
  return page;
}

async function plus(page, typeId, times) {
  const btn = page.locator(`[data-testid="ticket-type-${typeId}"] button[aria-label="Más"]`);
  await btn.scrollIntoViewIfNeeded();
  for (let i = 0; i < times; i++) await btn.click();
}

async function fillDatos(page, attendees) {
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  for (let i = 0; i < attendees; i++) {
    await page.fill(`#att-${i}-name`, `Asistente ${String(i + 1).padStart(2, "0")}`);
    await page.fill(`#att-${i}-email`, `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`);
    await page.selectOption(`#att-${i}-f-af-002-talla`, ["S", "M", "L", "XL"][i % 4]);
  }
  await page.fill("#taxid", CEDULA_OK);
}

/** Compra completa por la interfaz: queda en la confirmación con las entradas impresas. */
async function purchase(page, { a = 2, b = 0 } = {}) {
  await plus(page, "tt-002-a", a);
  if (b) await plus(page, "tt-002-b", b);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await fillDatos(page, a + b);
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
}

async function readDb(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.state ?? null, DB_KEY);
}

function decodeQr(dataUrl) {
  const png = PNG.sync.read(Buffer.from(dataUrl.split(",")[1], "base64"));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

/** Abre un correo desde la confirmación y devuelve el marco del iframe. */
async function emailFrame(page) {
  const handle = await page.locator('[data-testid="correo-iframe"]').elementHandle();
  check(handle, "No apareció el iframe del correo");
  const frame = await handle.contentFrame();
  check(frame, "El iframe del correo no tiene documento");
  await frame.waitForLoadState("domcontentloaded");
  return frame;
}

/* ───────── casos ───────── */

async function p1TicketEmail() {
  const context = await newContext();
  const page = await openEdition(context);
  await purchase(page, { a: 2, b: 1 });
  const link = page.locator('a[data-testid="ver-correo"]');
  await link.waitFor();
  await link.click();
  await page.waitForURL(/\/correo\/\?id=em-/);

  // Barra obligatoria y metadatos del correo
  await page.getByText("Vista previa · este correo no se envía").waitFor();
  check((await page.locator('[data-testid="correo-para"]').textContent()).trim() === "comprador@ejemplo.com", "El correo debe ir a quien compra");
  const subject = (await page.locator('[data-testid="correo-asunto"]').textContent()).trim();
  check(subject.length > 5, "El correo debe tener asunto");

  // Iframe aislado con srcDoc y sin scripts
  const iframe = page.locator('[data-testid="correo-iframe"]');
  const sandbox = (await iframe.getAttribute("sandbox")) ?? "";
  check(!/allow-scripts/.test(sandbox), `El iframe no debe permitir scripts: sandbox="${sandbox}"`);
  check(((await iframe.evaluate((el) => el.getAttribute("srcdoc"))) ?? "").length > 500, "El iframe debe usar srcDoc");
  const frame = await emailFrame(page);
  await frame.locator("img[data-qr]").first().waitFor();

  // N QR (uno por asistente), todos distintos y con token válido
  const srcs = await frame.locator("img[data-qr]").evaluateAll((els) => els.map((e) => e.src));
  check(srcs.length === 3, `El correo debe mostrar 3 QR, muestra ${srcs.length}`);
  const tokens = srcs.map(decodeQr);
  check(tokens.every(Boolean) && new Set(tokens).size === 3, "Los 3 QR deben decodificarse y ser distintos");
  const db = await readDb(page);
  const order = Object.values(db.orders).find((o) => o.status === "paid" && !o.isSeed);
  const orderTickets = Object.values(db.tickets).filter((t) => t.orderId === order.id).map((t) => t.id).sort();
  const parsed = [];
  for (const t of tokens) {
    const p = await verifyTicketToken(t);
    check(p && p.version === 1, `Token del correo inválido: ${t}`);
    parsed.push(p.ticketId);
  }
  check(parsed.sort().join() === orderTickets.join(), "Los QR del correo deben ser los de las entradas de la orden");

  // Datos de la edición, cronograma y cómo llegar
  const text = (await frame.locator("body").textContent()).replace(/\s+/g, " ");
  const edition = db.editions["ed-002"];
  check(text.includes(edition.title), `Falta el título de la edición (${edition.title})`);
  check(/Cronograma/i.test(text) && /Cómo llegar/i.test(text), "Falta el cronograma o 'Cómo llegar'");
  check(text.includes("[[PENDIENTE"), "Los datos pendientes de la edición deben verse como [[PENDIENTE]]");
  for (const a of ["Asistente 01", "Asistente 02", "Asistente 03"]) check(text.includes(a), `Falta ${a} en el correo`);
  await context.close();
  return `${srcs.length} QR distintos → tokens válidos de la orden; título "${edition.title}", cronograma y cómo llegar; iframe sandbox="${sandbox}" con srcDoc; asunto "${subject}"`;
}

async function p2Ride() {
  const context = await newContext();
  const page = await openEdition(context);
  await purchase(page, { a: 2 });
  const link = page.locator('a[data-testid="ver-factura"]');
  await link.waitFor();
  await link.click();
  await page.waitForURL(/\/factura\/\?id=/);
  const ride = page.locator('[data-testid="ride"]');
  await ride.waitFor();

  const mark = page.locator('[data-testid="ride-marca-agua"]');
  check((await mark.textContent()).trim() === "DEMO, SIN VALIDEZ TRIBUTARIA", "Texto de la marca de agua");
  const box = await mark.boundingBox();
  const rideBox = await ride.boundingBox();
  check(box && rideBox && box.width * box.height > 0.12 * rideBox.width * rideBox.height, "La marca de agua debe ser grande");

  const rideText = (await ride.textContent()).replace(/\s+/g, " ");
  for (const needle of ["[[PENDIENTE: RUC de la clienta]]", "[[PENDIENTE: razón social", "[[PENDIENTE: dirección matriz", "[[PENDIENTE: tarifa de IVA"]) {
    check(rideText.includes(needle), `El RIDE debe mostrar ${needle}`);
  }
  check(rideText.includes("$XX"), "Los montos de ejemplo deben verse $XX");
  check(!/\$\s?\d/.test(rideText), "No debe haber montos con cifras reales");
  check(rideText.includes(CEDULA_OK), "Debe mostrar la identificación del comprador");

  // "Descargar PDF" llama a window.print()
  await page.locator('[data-testid="descargar-pdf"]').click();
  check((await page.evaluate(() => window.__printCalls)) === 1, "Descargar PDF debe llamar a window.print() una vez");

  // Impresión: A4, sin el chrome del sitio y con la marca de agua
  await page.emulateMedia({ media: "print" });
  const hidden = await page.evaluate(() => {
    const vis = (sel) => [...document.querySelectorAll(sel)].every((e) => getComputedStyle(e).display === "none");
    return { header: vis("header"), footer: vis("footer"), badge: vis(".demo-badge") };
  });
  check(hidden.header && hidden.footer && hidden.badge, `En impresión se ocultan encabezado, pie y etiqueta: ${JSON.stringify(hidden)}`);
  check(await mark.isVisible(), "La marca de agua debe seguir visible al imprimir");
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pdfText = pdf.toString("latin1");
  const media = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdfText);
  check(media, "No se pudo leer el tamaño de página del PDF");
  const [w, h] = [Number(media[1]), Number(media[2])];
  check(Math.abs(w - 595) < 3 && Math.abs(h - 842) < 3, `La página debe ser A4 (595×842 pt), es ${w}×${h}`);
  const pages = (pdfText.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  check(pages >= 1 && pages <= 2, `El RIDE debe caber en 1 o 2 páginas A4, ocupa ${pages}`);
  await context.close();
  return `marca de agua visible (${Math.round(box.width)}×${Math.round(box.height)} px); [[PENDIENTE]] de RUC, razón social, dirección e IVA; $XX; window.print() ×1; PDF ${w}×${h} pt (A4), ${pages} pág.`;
}

async function p3Reminder() {
  const context = await newContext();
  const page = await openEdition(context);
  await purchase(page, { a: 1 });
  await page.locator('[data-testid="ver-recordatorio"]').click();
  await page.waitForURL(/\/correo\/\?id=em-/);
  await page.getByText("Vista previa · este correo no se envía").waitFor();
  const frame = await emailFrame(page);
  await frame.locator("img[data-qr]").first().waitFor();
  const text = (await frame.locator("body").textContent()).replace(/\s+/g, " ");
  check(/Tu bond es/i.test(text) && /mañana/i.test(text), "El recordatorio debe decir «Tu bond es mañana»");
  check(/Horario/i.test(text) && /La sede/i.test(text), "Debe traer horario y sede");
  check((await frame.locator("img[data-qr]").count()) === 1, "El recordatorio lleva el QR de la entrada");
  const subject = (await page.locator('[data-testid="correo-asunto"]').textContent()).trim();
  check(/mañana/i.test(subject), `El asunto debe decir mañana: ${subject}`);
  const db = await readDb(page);
  check(Object.values(db.emails).filter((e) => e.template === "reminder").length === 1, "Debe quedar un solo correo de recordatorio");
  await context.close();
  return `recordatorio con asunto "${subject}", horario, sede y QR; queda registrado 1 correo 'reminder'`;
}

async function p4Transfer() {
  const context = await newContext();
  const page = await openEdition(context);
  await purchase(page, { a: 2 });
  await page.locator('[data-testid="mi-entrada"]').first().waitFor();
  await page.locator('[data-testid="mi-entrada"]').first().click();
  await page.waitForURL(/\/entrada\/\?t=/);
  const oldUrl = page.url();
  const oldToken = new URL(oldUrl).searchParams.get("t");
  await page.locator('[data-testid="entrada"]').waitFor();
  const parsedOld = await verifyTicketToken(oldToken);
  check(parsedOld && parsedOld.version === 1, "El token inicial debe verificar (versión 1)");
  check((await page.locator('[data-testid="entrada-asistente"]').textContent()).trim() === "Asistente 01", "La primera entrada es de Asistente 01");

  // Formulario → modal propio → confirmar
  await page.fill("#transfer-name", "Asistente Nueva");
  await page.fill("#transfer-email", "nueva@ejemplo.com");
  await page.locator('[data-testid="transfer-enviar"]').click();
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  check((await dialog.getAttribute("aria-modal")) === "true", "El modal de transferencia debe declarar aria-modal");
  check(/Asistente Nueva/.test(await dialog.textContent()), "El modal debe resumir a quién se transfiere");
  await page.locator('[data-testid="transfer-confirmar"]').click();
  await page.waitForFunction((old) => new URL(location.href).searchParams.get("t") !== old, oldToken);
  await page.locator('[data-testid="transfer-ok"]').waitFor();

  const newToken = new URL(page.url()).searchParams.get("t");
  const parsedNew = await verifyTicketToken(newToken);
  check(parsedNew && parsedNew.ticketId === parsedOld.ticketId && parsedNew.version === 2, "El token nuevo debe verificar con la versión 2");
  check((await page.locator('[data-testid="entrada-asistente"]').textContent()).trim() === "Asistente Nueva", "La entrada debe mostrar a la nueva titular");
  check(/QR 2/.test(await page.locator('[data-testid="entrada-codigo"]').textContent()), "El código debe indicar QR 2");

  // Estado guardado: versión + 1 y dos correos `transfer`
  const db = await readDb(page);
  const ticket = db.tickets[parsedOld.ticketId];
  check(ticket.version === 2 && ticket.status === "valid" && ticket.attendee.email === "nueva@ejemplo.com", "La entrada guardada debe tener version 2 y la nueva titular");
  await page.waitForFunction((key) => {
    const st = JSON.parse(localStorage.getItem(key)).state;
    return Object.values(st.emails).filter((e) => e.template === "transfer").length === 2;
  }, DB_KEY);
  const transfers = Object.values((await readDb(page)).emails).filter((e) => e.template === "transfer");
  const roles = transfers.map((t) => `${t.transfer.role}:${t.to}`).sort();
  check(
    roles.join() === ["new-holder:nueva@ejemplo.com", "previous-holder:asistente01@ejemplo.com"].sort().join(),
    `Correos de transferencia: ${roles.join(", ")}`,
  );

  // Correo a la nueva titular: lleva su QR nuevo (versión 2)
  await page.locator('[data-testid="correo-transferencia"]', { hasText: "nueva titular" }).click();
  await page.waitForURL(/\/correo\/\?id=em-/);
  const frame = await emailFrame(page);
  await frame.locator("img[data-qr]").first().waitFor();
  const qrToken = decodeQr(await frame.locator("img[data-qr]").first().evaluate((e) => e.src));
  const qrParsed = await verifyTicketToken(qrToken);
  check(qrParsed && qrParsed.version === 2, "El correo a la nueva titular debe llevar el QR versión 2");

  // El enlace viejo ya no vale; el nuevo sí
  await page.goto(oldUrl);
  await page.locator('[data-testid="entrada-invalida"]').waitFor();
  const heading = (await page.locator('[data-testid="entrada-invalida"]').textContent()).replace(/\s+/g, " ").trim();
  const reason = (await page.locator('[data-testid="entrada-invalida-motivo"]').textContent()).trim();
  check(/Esta entrada ya no es válida/.test(heading) && /fue transferida/.test(reason), `Texto del QR viejo: "${heading}" ${reason}`);
  check((await page.locator('[data-testid="entrada"]').count()) === 0, "El QR viejo no debe mostrar la entrada");
  await page.goto(`${BASE}/entrada/?t=${encodeURIComponent(newToken)}`);
  await page.locator('[data-testid="entrada"]').waitFor();
  check((await page.locator('[data-testid="entrada-asistente"]').textContent()).trim() === "Asistente Nueva", "El QR nuevo debe mostrar la entrada");

  // Un token con la firma alterada tampoco vale
  await page.goto(`${BASE}/entrada/?t=${encodeURIComponent(newToken.slice(0, -2) + "xx")}`);
  await page.locator('[data-testid="entrada-invalida"]').waitFor();
  await context.close();
  return `v1 → v2 (${parsedOld.ticketId}); modal propio; 2 correos 'transfer' (${roles.join(", ")}); QR viejo: "${heading} ${reason}"; QR nuevo válido; firma alterada rechazada`;
}

/** Empaqueta el order-service REAL para ejecutarlo en la página (ver el encabezado). */
async function bundleOrderService() {
  const dir = mkdtempSync(join(tmpdir(), "bond-e2e-"));
  const entry = join(dir, "entry.ts");
  const srcDir = fileURLToPath(new URL("../src", import.meta.url));
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    entry,
    `import { useDbStore } from "@/store/db-store";
import { cancelOrder } from "@/services/order-service";
(globalThis as any).__e2e = {
  async cancelOrder(orderId: string, refund: boolean) {
    await useDbStore.persist.rehydrate();
    const r = await cancelOrder(orderId, { refund });
    if (!r.ok) return { ok: false, message: r.message };
    await r.followUps;
    return { ok: true, status: r.order.status, freedSeats: r.freedSeats, notified: r.notified.map((w) => w.id) };
  },
};
`,
  );
  const out = join(dir, "bundle.js");
  await build({
    input: entry,
    platform: "browser",
    resolve: { alias: { "@": [srcDir] } },
    transform: { define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_MOCK_LATENCY": '"0"' } },
    output: { file: out, format: "iife", minify: false },
    logLevel: "silent",
  });
  return readFileSync(out, "utf8");
}

async function p5Waitlist() {
  const context = await newContext();
  const page = await openEdition(context);
  // 1) Una compra real (queda una orden pagada de la ed. 002)
  await purchase(page, { a: 1 });
  const db0 = await readDb(page);
  const order = Object.values(db0.orders).find((o) => o.status === "paid" && !o.isSeed);

  // 2) Edición agotada con el interruptor del panel de demo, y alguien entra a la lista
  await setFlags(page, { forceSoldOut: true });
  await page.goto(EDITION);
  const submit = page.getByRole("button", { name: /Avísame si se libera un cupo/ }).first();
  await submit.waitFor();
  const form = page.locator("form", { has: submit }).first();
  await form.getByLabel("Nombre").fill("Lista Prueba");
  await form.getByLabel("Correo").fill("lista.prueba@ejemplo.com");
  await submit.click();
  await page.getByText("Estás en la").first().waitFor();
  const db1 = await readDb(page);
  const entry = Object.values(db1.waitlist).find((w) => w.email === "lista.prueba@ejemplo.com");
  check(entry && entry.editionId === "ed-002" && entry.notifiedAt === null, "La persona debe quedar en la lista de ed-002 sin avisar");

  // 3) Cancelar la orden con el servicio real (ver el encabezado del archivo)
  check((await page.evaluate(() => typeof window.__e2e)) === "undefined", "El sitio publicado no debe traer ganchos de pruebas");
  await page.addScriptTag({ content: await bundleOrderService() });
  const result = await page.evaluate(([id]) => window.__e2e.cancelOrder(id, true), [order.id]);
  check(result.ok && result.status === "refunded" && result.freedSeats === 1, `Resultado de cancelOrder: ${JSON.stringify(result)}`);
  check(result.notified.join() === entry.id, `Debe avisarse a ${entry.id}, avisó a ${result.notified.join()}`);

  // 4) Recargar: el sitio lee el estado guardado
  await page.goto(EDITION);
  await page.waitForTimeout(500);
  const db2 = await readDb(page);
  const after = db2.waitlist[entry.id];
  check(after.notifiedAt, "La entrada de la lista de espera debe tener notifiedAt");
  check(db2.orders[order.id].status === "refunded", "La orden debe quedar reembolsada");
  check(Object.values(db2.tickets).filter((t) => t.orderId === order.id).every((t) => t.status === "cancelled"), "Las entradas deben quedar canceladas");
  const mail = Object.values(db2.emails).find((e) => e.template === "waitlist-available" && e.to === "lista.prueba@ejemplo.com");
  check(mail, "Debe registrarse el correo waitlist-available a la persona de la lista");

  // 5) Vista previa del correo
  await page.goto(`${BASE}/correo/?id=${mail.id}`);
  await page.getByText("Vista previa · este correo no se envía").waitFor();
  check((await page.locator('[data-testid="correo-para"]').textContent()).trim() === "lista.prueba@ejemplo.com", "El correo va a la persona de la lista");
  const frame = await emailFrame(page);
  await frame.getByText("Ver la edición").first().waitFor();
  const text = (await frame.locator("body").textContent()).replace(/\s+/g, " ");
  check(/Se liberó un/i.test(text) && /cupo/i.test(text) && text.includes("Lista Prueba"), "El correo debe avisar del cupo y saludar por nombre");
  const href = await frame.getByText("Ver la edición").first().evaluate((el) => el.closest("a")?.href ?? "");
  check(/the-power-hour\/?#entradas$/.test(href), `El botón debe llevar a la edición: ${href}`);
  await context.close();
  return `compra ${order.id} → ed-002 agotada (interruptor) → ${entry.id} se anota → cancelOrder(reembolso) libera ${result.freedSeats} cupo y avisa a ${result.notified.join()} → correo ${mail.id} registrado y con vista previa`;
}

/* Pulido */

/** Rectángulos de texto y controles visibles que cruzan el rectángulo de la etiqueta DEMO. */
async function badgeOverlaps(page) {
  return page.evaluate(() => {
    const badge = document.querySelector(".demo-badge");
    if (!badge) return { error: "No hay etiqueta DEMO" };
    const b = badge.getBoundingClientRect();
    const style = getComputedStyle(badge);
    const hit = [];
    const sel = "a, button, input, select, textarea, label, h1, h2, h3, h4, p, li, dt, dd, summary, th, td, span.label-caps";
    for (const el of document.querySelectorAll(sel)) {
      if (badge.contains(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      if (el.closest("[inert], [aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (cs.clipPath !== "none" || cs.clip !== "auto") continue; // `sr-only` (enlace «Saltar al contenido»: solo aparece con foco)
      const overlaps = r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
      if (!overlaps) continue;
      // Cuenta solo si el elemento realmente queda debajo de la etiqueta (la etiqueta lo tapa)
      const cx = Math.min(Math.max(r.left + r.width / 2, b.left + 1), b.right - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, b.top + 1), b.bottom - 1);
      const top = document.elementFromPoint(cx, cy);
      if (top && badge.contains(top)) hit.push(`${el.tagName.toLowerCase()}: ${(el.textContent ?? "").trim().slice(0, 40)}`);
    }
    return { position: style.position, rect: { top: Math.round(b.top), bottom: Math.round(b.bottom) }, hit };
  });
}

async function scrollSweep(page, fn) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  const results = [];
  for (let y = 0; y <= total - vh + 200; y += Math.floor(vh * 0.6)) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
    results.push(await fn(y));
  }
  return results;
}

async function p6aBadge() {
  const context = await newContext();
  const page = await openEdition(context);
  const visited = [];
  async function sweep(label) {
    await page.waitForTimeout(500);
    const rs = await scrollSweep(page, () => badgeOverlaps(page));
    for (const r of rs) {
      check(!r.error, `${label}: ${r.error}`);
      check(r.position !== "fixed" && r.position !== "sticky", `${label}: en móvil la etiqueta no debe flotar (position ${r.position})`);
      check(r.hit.length === 0, `${label}: la etiqueta DEMO tapa ${r.hit.join(" | ")}`);
    }
    visited.push(`${label} (${rs.length} posiciones)`);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await sweep("edición");
  await plus(page, "tt-002-a", 2); // aparece la barra fija de compra
  await sweep("edición con barra fija");
  await page.goto(`${BASE}/`);
  await sweep("home");
  await page.goto(`${BASE}/ediciones/the-power-hour`);
  await page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]').waitFor();
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await page.locator("#buyer-name").waitFor();
  await sweep("datos");
  await fillDatos(page, 2);
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
  await sweep("pago");
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  await page.waitForTimeout(4500);
  await sweep("confirmación");
  await page.locator('a[data-testid="ver-correo"]').click();
  await page.waitForURL(/\/correo\//);
  await emailFrame(page);
  await sweep("correo");
  await page.goBack();
  await page.locator('a[data-testid="ver-factura"]').click();
  await page.waitForURL(/\/factura\//);
  await page.locator('[data-testid="ride"]').waitFor();
  await sweep("factura");
  await page.goBack();
  await page.locator('[data-testid="mi-entrada"]').first().click();
  await page.waitForURL(/\/entrada\//);
  await page.locator('[data-testid="entrada"]').waitFor();
  await sweep("mi entrada");
  await context.close();
  return `en 390 px la etiqueta es una franja en el flujo (no flota) y no tapa nada en: ${visited.join(", ")}`;
}

async function visibleContinuar(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a")) {
      if (!/^Continuar/.test((el.textContent ?? "").trim())) continue;
      if (el.closest("[inert], [aria-hidden='true']")) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.bottom <= 0 || r.top >= innerHeight) continue;
      out.push(el.getAttribute("data-testid") ?? el.id ?? "continuar");
    }
    return out;
  });
}

async function p6bOneContinuar() {
  const context = await newContext();
  const page = await openEdition(context);
  await plus(page, "tt-002-a", 1);
  await page.waitForTimeout(500);
  const footerVisible = () =>
    page.evaluate(() => {
      const f = document.querySelector("footer");
      if (!f) return false;
      const r = f.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    });
  let max = 0;
  let positions = 0;
  const missing = [];
  const seen = new Set();
  const results = await scrollSweep(page, async (y) => ({ y, ids: await visibleContinuar(page), footer: await footerVisible() }));
  // Barrido fino también, para no perder la transición entre la barra y el botón de la página
  for (let y = 0; y < 6000; y += 120) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(320); // deja terminar la transición de la barra
    results.push({ y, ids: await visibleContinuar(page), footer: await footerVisible() });
  }
  for (const r of results) {
    positions += 1;
    max = Math.max(max, r.ids.length);
    r.ids.forEach((id) => seen.add(id));
    if (r.ids.length > 1) throw new Error(`Con scroll ${r.y} se ven ${r.ids.length} «Continuar» a la vez: ${r.ids.join(", ")}`);
    if (r.ids.length === 0 && !r.footer) missing.push(r.y);
  }
  check(missing.length === 0, `Hay posiciones sin ningún «Continuar» alcanzable (fuera del pie): scroll ${missing.join(", ")}`);
  check(seen.has("sticky-continuar") && seen.has("continuar"), `Deben alternarse la barra y el botón de la página: ${[...seen].join(", ")}`);
  await context.close();
  return `390 px, con selección: máximo ${max} «Continuar» visible en ${positions} posiciones de scroll; se alternan ${[...seen].join(" ↔ ")} y nunca falta uno fuera del pie`;
}

/** Muestrea cada cuadro lo que anima el ticket impreso, desde antes de pagar. */
async function sampleTickets(page) {
  await page.evaluate(() => {
    window.__samples = [];
    const start = performance.now();
    const props = new Set();
    window.__animProps = props;
    function frame() {
      const lis = [...document.querySelectorAll('[data-testid="printed-ticket"]')];
      for (const li of lis) {
        const art = li.querySelector("article");
        const a = getComputedStyle(li);
        const b = art ? getComputedStyle(art) : null;
        window.__samples.push({
          t: performance.now() - start,
          li: { clip: a.clipPath, transform: a.transform, opacity: a.opacity },
          art: b ? { clip: b.clipPath, transform: b.transform, opacity: b.opacity } : null,
        });
      }
      for (const anim of document.getAnimations()) {
        const target = anim.effect?.target;
        if (!(target instanceof Element) || !target.closest('[data-testid="tickets"]')) continue;
        for (const kf of anim.effect.getKeyframes()) for (const k of Object.keys(kf)) props.add(k);
      }
      if (performance.now() - start < 7000) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

async function runTicketMotion(reduced) {
  const context = await newContext({ reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await openEdition(context);
  await plus(page, "tt-002-a", 2);
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await fillDatos(page, 2);
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
  await sampleTickets(page);
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  await page.waitForTimeout(7200);
  const { samples, props } = await page.evaluate(() => ({ samples: window.__samples, props: [...window.__animProps] }));
  await context.close();
  return { samples, props };
}

const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)"]);

async function p6cReducedMotion() {
  const { samples, props } = await runTicketMotion(true);
  check(samples.length > 10, `Muy pocas muestras del ticket (${samples.length})`);
  const clips = new Set(samples.flatMap((s) => [s.li.clip, s.art?.clip]).filter(Boolean));
  const transforms = new Set(samples.flatMap((s) => [s.li.transform, s.art?.transform]).filter(Boolean));
  check([...clips].every((c) => c === "none"), `Con movimiento reducido no debe haber clip-path animado: ${[...clips].join(" | ")}`);
  check([...transforms].every((t) => IDENTITY.has(t)), `Con movimiento reducido no debe haber transform: ${[...transforms].join(" | ")}`);
  const allowed = new Set(["opacity", "offset", "easing", "composite", "computedOffset"]);
  check(props.every((p) => allowed.has(p)), `Las animaciones del ticket solo pueden tocar opacity: ${props.join(", ")}`);
  const opacities = samples.map((s) => Number(s.li.opacity));
  check(Math.min(...opacities) < 1 && opacities.at(-1) === 1, "Debe haber un fundido (la opacidad pasa de <1 a 1)");

  // Control: sin la preferencia, el ticket sí se "imprime" (clip-path y transform cambian);
  // así sabemos que la comprobación detectaría una animación de entrada.
  const control = await runTicketMotion(false);
  const cclips = new Set(control.samples.map((s) => s.li.clip));
  const ctransforms = new Set(control.samples.map((s) => s.art?.transform));
  check(cclips.size > 3 && ctransforms.size > 3, `El control (movimiento normal) debía animar clip-path y transform: ${cclips.size}/${ctransforms.size} valores`);
  return `reduce: ${samples.length} cuadros, clip-path ${[...clips].join()}, transform ${[...transforms].join(" | ")}, opacidad ${Math.min(...opacities).toFixed(2)} → 1, animaciones solo de [${props.join(", ")}]; control sin preferencia: ${cclips.size} clip-path y ${ctransforms.size} transform distintos`;
}

/* ───────── ejecución ───────── */

const cases = [
  ["Correo de entrada: N QR y datos de la edición, en iframe aislado bajo la barra «no se envía»", p1TicketEmail],
  ["Factura RIDE con marca de agua DEMO, [[PENDIENTE]], $XX, A4 y «Descargar PDF»", p2Ride],
  ["Existe la vista previa del recordatorio «Tu bond es mañana»", p3Reminder],
  ["Transferir invalida el QR anterior y genera uno nuevo", p4Transfer],
  ["Edición agotada: lista de espera → cancelar una orden → correo de aviso con vista previa", p5Waitlist],
  ["Pulido (a): la etiqueta DEMO no tapa texto ni CTAs en 390 px", p6aBadge],
  ["Pulido (b): un solo «Continuar» visible a la vez en 390 px", p6bOneContinuar],
  ["Pulido (c): con prefers-reduced-motion el ticket impreso solo hace fundido", p6cReducedMotion],
];

let failed = 0;
for (const [i, [name, fn]] of cases.entries()) {
  const started = Date.now();
  try {
    const detail = await fn();
    console.log(`PASS  P${i + 1}  ${name}\n        ${detail}  (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL  P${i + 1}  ${name}\n        ${e.message}`);
  }
}
await browser.close();
if (pageErrors.length) console.log(`\nAviso: ${pageErrors.length} error(es) de consola/página:\n  ${[...new Set(pageErrors)].join("\n  ")}`);
console.log(`\n${failed === 0 ? "TODOS LOS CRITERIOS PASAN" : `${failed} CRITERIO(S) FALLAN`} (${cases.length - failed}/${cases.length})`);
process.exit(failed === 0 ? 0 : 1);
