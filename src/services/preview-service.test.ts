import { beforeEach, describe, expect, it } from "vitest";
import { storage } from "@/adapters";
import { configureLatency } from "@/adapters/mock/latency";
import { renderEmailHtml } from "@/emails/render";
import { color } from "@/emails/theme";
import { useDbStore } from "@/store/db-store";
import { DEFAULT_FLAGS, useDemoStore } from "@/store/demo-store";
import { cancelOrder } from "./order-service";
import { loadEmailPreview, loadInvoicePreview } from "./preview-service";
import { ensureReminder, transferTicket } from "./ticket-service";

const SITE = "https://demo.test/thebond-demo";

beforeEach(() => {
  configureLatency({ min: 0, max: 0 });
  useDbStore.getState().resetDemo();
  useDemoStore.setState({ ...DEFAULT_FLAGS });
});

async function html(emailId: string): Promise<string> {
  const r = await loadEmailPreview(emailId, SITE);
  if (!r.ok) throw new Error(r.message);
  return renderEmailHtml(r.model);
}

const qrImages = (h: string) => h.match(/<img[^>]+data-qr="[^"]+"[^>]*>/g) ?? [];

describe("vista previa del correo de entrada", () => {
  it("un correo semilla (sin referencias) muestra el QR de cada entrada de la orden y los datos de la edición", async () => {
    const log = (await storage.emails.list()).find((e) => e.template === "ticket");
    if (!log?.orderId) throw new Error("sin correo semilla");
    const order = await storage.orders.get(log.orderId);
    const tickets = (await storage.tickets.list()).filter((t) => t.orderId === log.orderId);
    const out = await html(log.id);

    expect(qrImages(out)).toHaveLength(tickets.length);
    for (const t of tickets) expect(out).toContain(t.attendee.name);
    expect(out).toContain("The Power Hour");
    expect(out).toContain("Cronograma");
    expect(out).toContain("PENDIENTE: indicaciones para llegar");
    expect(out).toContain(`${SITE}/email/logo-cream.png`);
    expect(out).toContain(`${SITE}/entrada/?t=`);
    expect(out).toContain(order?.buyer.name ?? "");
    expect(out).toContain("data:image/png;base64,");
  });

  it("los colores del correo salen del tema (tokens), sin variables CSS", async () => {
    const log = (await storage.emails.list()).find((e) => e.template === "ticket");
    if (!log) throw new Error("sin correo semilla");
    const out = await html(log.id);
    expect(out).toContain(color.butter);
    expect(out).not.toContain("var(--");
  });

  it("un correo viejo conserva su QR y su nombre aunque la entrada se haya transferido", async () => {
    const ticket = (await storage.tickets.list()).find((t) => t.editionId === "ed-002" && t.status === "valid");
    if (!ticket) throw new Error("sin entrada");
    // correo de entrada enviado a esa asistente con su versión 1
    await storage.emails.save({
      id: "em-viejo",
      template: "ticket",
      to: ticket.attendee.email,
      subject: "Tu entrada a THE BOND",
      orderId: ticket.orderId,
      ticketId: ticket.id,
      sentAt: new Date().toISOString(),
      toName: ticket.attendee.name,
      ticketRefs: [{ ticketId: ticket.id, version: 1, attendeeName: ticket.attendee.name }],
    });
    const before = await html("em-viejo");
    const r = await transferTicket(ticket.id, 1, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    if (!r.ok) throw new Error("transferencia");
    const after = await html("em-viejo");
    expect(after).toBe(before);
    expect(after).toContain(ticket.attendee.name);
    expect(after).not.toContain("Nueva Titular");
  });

  it("correo inexistente: mensaje claro", async () => {
    const r = await loadEmailPreview("em-no-existe", SITE);
    expect(r.ok).toBe(false);
  });
});

describe("recordatorio, lista de espera y transferencia", () => {
  it("recordatorio: «Tu bond es mañana» con horario, sede y un QR", async () => {
    const ticket = (await storage.tickets.list()).find((t) => t.editionId === "ed-002" && t.status === "valid");
    if (!ticket) throw new Error("sin entrada");
    const log = await ensureReminder(ticket.id);
    if (!log) throw new Error("sin recordatorio");
    const out = await html(log.id);
    expect(out).toMatch(/Tu bond es/);
    expect(out).toContain("mañana.");
    expect(qrImages(out)).toHaveLength(1);
    expect(out).toContain("PENDIENTE: sede de la ed. 002");
    expect(out).toContain("Horario");
  });

  it("lista de espera: aviso con enlace a la edición, tras cancelar una orden", async () => {
    await storage.waitlist.save({
      id: "wl-x",
      editionId: "ed-002",
      name: "Espera Uno",
      email: "espera1@ejemplo.com",
      createdAt: new Date().toISOString(),
      notifiedAt: null,
    });
    const order = (await storage.orders.list()).find((o) => o.editionId === "ed-002" && o.status === "paid");
    if (!order) throw new Error("sin orden");
    const r = await cancelOrder(order.id, { refund: true });
    if (!r.ok) throw new Error("cancelación");
    await r.followUps;
    const log = (await storage.emails.list()).find((e) => e.template === "waitlist-available");
    if (!log) throw new Error("sin aviso");
    const out = await html(log.id);
    expect(out).toContain("Se liberó un");
    expect(out).toContain("Espera Uno");
    expect(out).toContain(`${SITE}/ediciones/the-power-hour/#entradas`);
  });

  it("transferencia: la nueva titular recibe su QR; la anterior, el aviso sin QR", async () => {
    const ticket = (await storage.tickets.list()).find((t) => t.editionId === "ed-002" && t.status === "valid");
    if (!ticket) throw new Error("sin entrada");
    const r = await transferTicket(ticket.id, ticket.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    if (!r.ok) throw new Error("transferencia");
    await r.followUps;
    const logs = (await storage.emails.list()).filter((e) => e.template === "transfer");
    const toNew = logs.find((e) => e.transfer?.role === "new-holder");
    const toOld = logs.find((e) => e.transfer?.role === "previous-holder");
    if (!toNew || !toOld) throw new Error("faltan correos");

    const newHtml = await html(toNew.id);
    expect(newHtml).toContain("Te dieron un");
    expect(newHtml).toContain("Nueva Titular");
    expect(qrImages(newHtml)).toHaveLength(1);

    const oldHtml = await html(toOld.id);
    expect(oldHtml).toContain("transferida.");
    expect(oldHtml).toContain("Tu QR anterior ya no es válido");
    expect(qrImages(oldHtml)).toHaveLength(0);
  });
});

describe("vista previa de la factura (RIDE)", () => {
  it("arma la factura con el comprador, el detalle por tipo y montos de ejemplo", async () => {
    const invoice = (await storage.invoices.list())[0];
    const r = await loadInvoicePreview(invoice.id);
    if (!r.ok) throw new Error(r.message);
    expect(r.invoice.number).toMatch(/^DEMO-\d{6}$/);
    expect(r.invoice.buyerName).toBe(r.order.buyer.name);
    expect(r.lines.length).toBeGreaterThan(0);
    expect(r.lines.reduce((s, l) => s + l.quantity, 0)).toBe(r.order.lines.reduce((s, l) => s + l.quantity, 0));
    expect(r.lines.every((l) => l.isExample)).toBe(true);
  });

  it("factura inexistente: mensaje claro", async () => {
    expect((await loadInvoicePreview("inv-no-existe")).ok).toBe(false);
  });
});
