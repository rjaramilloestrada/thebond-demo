import { beforeEach, describe, expect, it } from "vitest";
import { emails, invoices, payments, storage } from "./index";
import { configureLatency } from "./mock/latency";
import { useDbStore } from "@/store/db-store";
import { DEFAULT_FLAGS, useDemoStore } from "@/store/demo-store";
import { seed } from "@/seed/seed";
import { validateTaxId } from "@/domain/validation";
import { applyCoupon } from "@/domain/pricing";

beforeEach(() => {
  configureLatency({ min: 0, max: 0 });
  useDbStore.getState().resetDemo();
  useDemoStore.setState({ ...DEFAULT_FLAGS });
});

describe("datos semilla", () => {
  it("tiene la ed. 001 agotada y la ed. 002 con aforo de ejemplo 60", async () => {
    const e1 = await storage.editions.getBySlug("the-first-experience");
    const e2 = await storage.editions.getBySlug("the-power-hour");
    expect(e1?.soldOut).toBe(true);
    expect(e1?.dateLabel).toBe("25 OCT 2026");
    expect(e1?.schedule.map((s) => s.time)).toEqual(["10:00", "10:15", "10:55", "11:15", "11:45"]);
    expect(e2?.capacity).toBe(60);
    expect(e2?.capacityIsExample).toBe(true);
    expect(e2?.dateLabel).toContain("[[PENDIENTE");
  });

  it("la ed. 002 tiene ≥ 2 tipos de entrada con 3 etapas", async () => {
    const types = (await storage.ticketTypes.list()).filter((t) => t.editionId === "ed-002");
    expect(types.length).toBeGreaterThanOrEqual(2);
    for (const t of types) expect(t.stages.map((s) => s.key)).toEqual(["preventa", "general", "last-call"]);
  });

  it("BOND10 existe y aplica 10 %", async () => {
    const coupons = await storage.coupons.list();
    const r = applyCoupon({ code: "bond10", coupons, subtotalCents: 2000 });
    expect(r.ok && r.discountCents).toBe(200);
    expect((await storage.coupons.findByCode("BOND10"))?.kind).toBe("percent");
  });

  it("los datos de personas son ficticios y las cédulas semilla son válidas", async () => {
    const tickets = await storage.tickets.list();
    expect(tickets.every((t) => /^Asistente \d{2}$/.test(t.attendee.name))).toBe(true);
    const orders = await storage.orders.list();
    for (const o of orders) expect(validateTaxId(o.taxId.number).valid).toBe(true);
  });

  it("la semilla no contiene la palabra prohibida de marca", () => {
    expect(JSON.stringify(seed())).not.toMatch(/ign[ií]fera/i);
  });
});

describe("MockStorageAdapter", () => {
  it("guarda, lee y elimina", async () => {
    const before = (await storage.coupons.list()).length;
    await storage.coupons.save({
      id: "cp-test", code: "TEST", kind: "amount", value: 500, maxUses: 5, usedCount: 0,
      validFrom: null, validUntil: null, active: true, editionId: null,
    });
    expect((await storage.coupons.list()).length).toBe(before + 1);
    expect((await storage.coupons.get("cp-test"))?.code).toBe("TEST");
    await storage.coupons.remove("cp-test");
    expect(await storage.coupons.get("cp-test")).toBeUndefined();
  });

  it("reset restaura la semilla", async () => {
    await storage.coupons.remove("cp-bond10");
    expect(await storage.coupons.findByCode("BOND10")).toBeUndefined();
    await storage.reset();
    expect(await storage.coupons.findByCode("BOND10")).toBeDefined();
  });
});

describe("MockPaymentAdapter", () => {
  it("aprueba por defecto y rechaza si el panel de demo lo fuerza", async () => {
    const order = (await storage.orders.list())[0];
    const ok = await payments.createCharge(order);
    expect(ok.ok).toBe(true);
    useDemoStore.getState().setFlag("forcePaymentDecline", true);
    const bad = await payments.createCharge(order);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("declined");
  });

  it("reembolsa", async () => {
    expect((await payments.refund("ord-01")).ok).toBe(true);
  });
});

describe("MockEmailAdapter e InvoiceAdapter", () => {
  it("el correo queda registrado", async () => {
    const before = (await storage.emails.list()).length;
    await emails.send("ticket", "asistente01@ejemplo.com", { orderId: "ord-01" });
    expect((await storage.emails.list()).length).toBe(before + 1);
  });

  it("emite factura solo con cédula o RUC válidos", async () => {
    const order = (await storage.orders.list())[0];
    const ok = await invoices.issue(order, { kind: "cedula", number: order.taxId.number });
    expect(ok.ok).toBe(true);
    const bad = await invoices.issue(order, { kind: "cedula", number: "1234567890" });
    expect(bad.ok).toBe(false);
  });
});
