/**
 * E2E del modo presentación (decisión de Rafa, enmienda a la regla 0.1 del brief).
 * Corre a 390 px contra el export servido (la carpeta `out` copiada bajo
 * `/thebond-demo/` para el build de Pages, o en la raíz). Si el sitio está bajo una
 * subruta, va incluida en BASE_URL:
 *
 *   BASE_URL=http://localhost:4173/thebond-demo node scripts/e2e-presentacion.mjs
 *
 * Casos:
 *  M1  showPending = false (por defecto): ningún "[[PENDIENTE" ni "PENDIENTE:" en el DOM
 *      (texto, alt, aria-label, title, placeholder), ni <mark data-pending>, y todos los
 *      placeholders de imagen son la variante LIMPIA. Páginas: home, las dos ediciones, la
 *      hoja de compra, datos, pago, confirmación, mi entrada, correo y factura.
 *  M2  showPending = true: aparecen los marcadores resaltados y los placeholders
 *      ROTULADOS cargan (naturalWidth > 0), en las mismas páginas.
 *  M3  El interruptor funciona desde la píldora Demo (y persiste tras recargar), y
 *      "Reiniciar demo" restaura los datos semilla sin cambiar el modo.
 */
import { createRequire } from "node:module";

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
const EDITION = `${BASE}/ediciones/the-power-hour`;
const PAST = `${BASE}/ediciones/the-first-experience`;
const FLAGS_KEY = "thebond-demo-flags";
const DB_KEY = "thebond-demo";

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

async function newPage(showPending) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(`${BASE}/`);
  await setShowPending(page, showPending);
  return { context, page };
}

/** Escribe el estado persistido (mismo formato de zustand); sin la clave, el valor por defecto es false. */
async function setShowPending(page, value, omit = false) {
  await page.evaluate(
    ([key, v, skip]) => {
      const state = { forcePaymentDecline: false, forceSoldOut: false, fastReservationTimer: false, simulateLiveSales: false };
      if (!skip) state.showPending = v;
      localStorage.setItem(key, JSON.stringify({ state, version: 1 }));
    },
    [FLAGS_KEY, value, omit],
  );
}

async function openSheet(page) {
  const open = page.locator('dialog[data-testid="purchase-sheet"][open]');
  await page.locator('[data-testid="open-sheet"]').waitFor({ state: "visible" });
  for (let i = 0; i < 12 && !(await open.count()); i++) {
    await page.locator('[data-testid="open-sheet"]').click();
    await open.waitFor({ timeout: 700 }).catch(() => {});
  }
  await open.waitFor();
  await page.waitForFunction(() => {
    const b = document.querySelector('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
    return b && !b.disabled;
  });
}

/** Recorre la página para que carguen las imágenes diferidas. */
async function scrollThrough(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

/** Lee del DOM (sin scripts ni estilos) los marcadores, los textos y las imágenes de placeholder. */
async function scan(page) {
  return page.evaluate(() => {
    const texts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.parentElement?.closest("script, style, noscript, template")) continue;
      texts.push(n.textContent ?? "");
    }
    const body = texts.join(" ");
    const attrs = [];
    for (const el of document.querySelectorAll("[alt],[aria-label],[title],[placeholder]")) {
      for (const a of ["alt", "aria-label", "title", "placeholder"]) {
        const v = el.getAttribute(a);
        if (v && (/PENDIENTE/.test(v) || /Imagen provisional/.test(v))) attrs.push(`${a}="${v.slice(0, 50)}"`);
      }
    }
    const imgs = [...document.images].filter((i) => /\/placeholders\//.test(i.currentSrc || i.src));
    const labeled = imgs.filter((i) => !/-clean-/.test(i.currentSrc || i.src));
    const loadedLabeled = labeled.filter((i) => i.complete && i.naturalWidth > 0);
    const iframe = document.querySelector('[data-testid="correo-iframe"]');
    return {
      marker: /\[\[PENDIENTE|PENDIENTE:/.test(body),
      sample: (body.match(/.{0,30}\[\[PENDIENTE.{0,40}/) ?? [""])[0],
      attrs,
      marks: document.querySelectorAll("mark[data-pending]").length,
      imgs: imgs.length,
      labeled: labeled.length,
      loadedLabeled: loadedLabeled.length,
      iframeMarker: iframe ? /PENDIENTE/.test(iframe.getAttribute("srcdoc") ?? "") : null,
    };
  });
}

async function purchaseTo(page, stage) {
  await page.goto(EDITION);
  await openSheet(page);
  const a = page.locator('[data-testid="ticket-type-tt-002-a"] button[aria-label="Más"]');
  await a.click();
  await a.click();
  await page.getByRole("button", { name: /^Continuar/ }).first().click();
  await page.waitForURL(/\/comprar\/\?orden=ord-/);
  await page.locator("#buyer-name").waitFor();
  if (stage === "datos") return;
  await page.fill("#buyer-name", "Comprador Demo");
  await page.fill("#buyer-email", "comprador@ejemplo.com");
  for (let i = 0; i < 2; i++) {
    const block = page.locator(`[data-testid="attendee-${i}"]`);
    if (!(await block.evaluate((el) => el.hasAttribute("open")))) await block.locator("summary").click();
    await page.fill(`#att-${i}-name`, `Asistente ${String(i + 1).padStart(2, "0")}`);
    await page.fill(`#att-${i}-email`, `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`);
    await page.selectOption(`#att-${i}-f-af-002-talla`, "M");
  }
  await page.fill("#taxid", CEDULA_OK);
  await page.getByRole("button", { name: /Ir a pagar/ }).click();
  await page.waitForURL(/paso=pago/);
  await page.locator('[data-testid="tarjeta-de-prueba"]').waitFor();
  if (stage === "pago") return;
  await page.getByRole("button", { name: /^Pagar/ }).click();
  await page.waitForURL(/confirmacion/);
  await page.locator('[data-testid="printed-ticket"]').first().waitFor();
  await page.waitForTimeout(3500);
  await page.locator('a[data-testid="ver-correo"]').waitFor();
  await page.locator('a[data-testid="ver-factura"]').waitFor();
}

/** Recorre todas las pantallas del conjunto y devuelve el resultado de `scan` de cada una. */
async function surveyAll(showPending) {
  const { context, page } = await newPage(showPending);
  const out = {};
  const grab = async (name, wait) => {
    if (wait) await wait();
    await scrollThrough(page);
    out[name] = await scan(page);
  };
  await page.goto(`${BASE}/`);
  await grab("home");
  await page.goto(EDITION);
  await page.locator('[data-testid="open-sheet"]').waitFor();
  await page.waitForTimeout(600);
  await grab("power-hour");
  await page.goto(PAST);
  await page.waitForTimeout(600);
  await grab("first-experience");
  await page.goto(EDITION);
  await openSheet(page);
  await page.waitForTimeout(500);
  out["hoja de compra"] = await scan(page);
  await page.keyboard.press("Escape");

  await purchaseTo(page, "datos");
  await grab("datos");
  await purchaseTo(page, "pago");
  await grab("pago");
  await purchaseTo(page, "confirmacion");
  await grab("confirmación");
  await page.locator('[data-testid="mi-entrada"]').first().click();
  await page.waitForURL(/\/entrada\/\?t=/);
  await page.locator('[data-testid="entrada"]').waitFor();
  await page.waitForTimeout(600);
  await grab("mi entrada");
  await page.goBack();
  await page.locator('a[data-testid="ver-correo"]').click();
  await page.waitForURL(/\/correo\//);
  await page.locator('[data-testid="correo-iframe"]').waitFor();
  await page.waitForTimeout(1200);
  await grab("correo");
  await page.goBack();
  await page.locator('a[data-testid="ver-factura"]').click();
  await page.waitForURL(/\/factura\//);
  await page.locator('[data-testid="ride"]').waitFor();
  await grab("factura");
  await context.close();
  return out;
}

/* ───────── casos ───────── */

async function m1Hidden() {
  const out = await surveyAll(false);
  const lines = [];
  for (const [name, r] of Object.entries(out)) {
    check(!r.marker, `${name}: se ve un marcador [[PENDIENTE]]: «${r.sample}»`);
    check(r.attrs.length === 0, `${name}: hay atributos con pendientes o "Imagen provisional": ${r.attrs.join(", ")}`);
    check(r.marks === 0, `${name}: hay ${r.marks} <mark data-pending>`);
    check(r.labeled === 0, `${name}: ${r.labeled} placeholder(s) rotulados visibles (debe ser la variante limpia)`);
    check(r.iframeMarker !== true, `${name}: el correo trae un marcador PENDIENTE`);
    lines.push(`${name}${r.imgs ? ` (${r.imgs} img limpias)` : ""}`);
  }
  return `sin marcadores ni placeholders rotulados en: ${lines.join(", ")}`;
}

async function m2Visible() {
  const out = await surveyAll(true);
  const needMarks = ["home", "power-hour", "first-experience", "hoja de compra", "pago", "confirmación", "mi entrada", "factura"];
  const lines = [];
  for (const [name, r] of Object.entries(out)) {
    if (needMarks.includes(name)) check(r.marks > 0, `${name}: con showPending=true debe haber marcadores resaltados (hay ${r.marks})`);
    if (name === "correo") check(r.iframeMarker === true, "correo: con showPending=true el correo debe traer marcadores");
    lines.push(`${name} (${r.marks} marcadores${r.labeled ? `, ${r.loadedLabeled}/${r.labeled} rotulados cargan` : ""})`);
  }
  const withImages = ["home", "power-hour", "first-experience"];
  for (const name of withImages) {
    const r = out[name];
    check(r.labeled > 0, `${name}: con showPending=true los placeholders deben ser los rotulados`);
    check(r.loadedLabeled === r.labeled, `${name}: ${r.labeled - r.loadedLabeled} placeholder(s) rotulados no cargaron`);
    check(r.imgs === r.labeled, `${name}: quedan placeholders limpios con showPending=true`);
  }
  return `marcadores y placeholders rotulados en: ${lines.join(", ")}`;
}

async function m3PillToggle() {
  const { context, page } = await newPage(false);
  // Sin la clave persistida el valor por defecto es false
  await setShowPending(page, false, true);
  await page.goto(`${BASE}/`);
  await page.locator("[data-demo-pill]").waitFor();
  await page.waitForTimeout(600);
  check((await scan(page)).marks === 0, "Por defecto (sin la clave) no debe haber marcadores");

  const pill = page.locator("[data-demo-pill]");
  check(((await pill.textContent()) ?? "").trim() === "Demo", "La píldora dice «Demo»");
  const header = await pill.evaluate((el) => Boolean(el.closest("header")));
  check(header, "La píldora vive dentro del encabezado");
  const box = await pill.boundingBox();
  check(box.height >= 44 && box.width >= 44, `Objetivo táctil de la píldora ≥ 44 px: ${Math.round(box.width)}×${Math.round(box.height)}`);

  await pill.click();
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  const text = ((await dialog.textContent()) ?? "").replace(/\s+/g, " ");
  check(/Demo · datos simulados/i.test(text), `La hoja debe decir «Demo · datos simulados»: ${text}`);
  check(/Mostrar pendientes/.test(text) && /Reiniciar demo/.test(text), "La hoja debe traer «Mostrar pendientes» y «Reiniciar demo»");
  const sw = dialog.getByRole("switch", { name: /Mostrar pendientes/ });
  check((await sw.getAttribute("aria-checked")) === "false", "El interruptor empieza apagado");
  await sw.click();
  check((await sw.getAttribute("aria-checked")) === "true", "El interruptor debe encenderse");
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page.waitForTimeout(400);
  const on = await scan(page);
  check(on.marks > 0, `Con el interruptor encendido deben verse los marcadores (hay ${on.marks})`);
  const persisted = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state.showPending, FLAGS_KEY);
  check(persisted === true, "showPending debe persistirse en localStorage (thebond-demo-flags)");
  await page.reload();
  await page.waitForTimeout(900);
  check((await scan(page)).marks > 0, "Tras recargar sigue encendido");

  // Apagar otra vez desde la píldora
  await pill.click();
  await page.locator("dialog[open]").waitFor();
  await page.locator("dialog[open]").getByRole("switch", { name: /Mostrar pendientes/ }).click();
  await page.keyboard.press("Escape");
  await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page.waitForTimeout(400);
  const off = await scan(page);
  check(off.marks === 0 && !off.marker && off.labeled === 0, "Al apagarlo no debe quedar ningún marcador ni placeholder rotulado");

  // Reiniciar demo: restaura los datos semilla y no cambia el modo
  await purchaseTo(page, "confirmacion");
  const before = await page.evaluate((k) => Object.values(JSON.parse(localStorage.getItem(k)).state.orders).filter((o) => !o.isSeed).length, DB_KEY);
  check(before >= 1, "Antes de reiniciar debe haber una orden hecha en el demo");
  await pill.click();
  await page.locator("dialog[open]").waitFor();
  await page.locator("dialog[open]").getByRole("switch", { name: /Mostrar pendientes/ }).click(); // encendido, para comprobar que se conserva
  await page.locator('[data-testid="demo-reiniciar"]').click();
  await page.waitForURL((u) => /\/thebond-demo\/?$|^\/$/.test(u.pathname) || u.pathname === "/" || u.pathname.endsWith("/"), { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  const after = await page.evaluate(
    ([k, f]) => ({
      orders: Object.values(JSON.parse(localStorage.getItem(k)).state.orders).filter((o) => !o.isSeed).length,
      show: JSON.parse(localStorage.getItem(f)).state.showPending,
    }),
    [DB_KEY, FLAGS_KEY],
  );
  check(after.orders === 0, `Reiniciar demo debe dejar solo los datos semilla (quedan ${after.orders} órdenes del demo)`);
  check(after.show === true, "Reiniciar demo no cambia el modo presentación");
  await context.close();
  return `píldora «Demo» en el encabezado (${Math.round(box.width)}×${Math.round(box.height)} px) → hoja con «Demo · datos simulados» → interruptor enciende (${on.marks} marcadores) → persiste y sobrevive a recargar → apaga (0 marcadores) → «Reiniciar demo» (${before} → ${after.orders} órdenes) conserva el modo`;
}

const cases = [
  ["showPending = false: ni [[PENDIENTE]] ni placeholders rotulados en home, ediciones, hoja, datos, pago, confirmación, mi entrada, correo y factura", m1Hidden],
  ["showPending = true: marcadores resaltados y placeholders rotulados que cargan", m2Visible],
  ["El interruptor funciona desde la píldora Demo, persiste y «Reiniciar demo» conserva el modo", m3PillToggle],
];

let failed = 0;
for (const [i, [name, fn]] of cases.entries()) {
  const started = Date.now();
  try {
    const detail = await fn();
    console.log(`PASS  M${i + 1}  ${name}\n        ${detail}  (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL  M${i + 1}  ${name}\n        ${e.message}`);
  }
}
await browser.close();
if (pageErrors.length) console.log(`\nAviso: ${pageErrors.length} error(es) de página:\n  ${[...new Set(pageErrors)].join("\n  ")}`);
console.log(`\n${failed === 0 ? "TODOS LOS CASOS PASAN" : `${failed} CASO(S) FALLAN`} (${cases.length - failed}/${cases.length})`);
process.exit(failed === 0 ? 0 : 1);
