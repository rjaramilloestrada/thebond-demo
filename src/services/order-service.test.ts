import { beforeEach, describe, expect, it } from "vitest";
import { storage } from "@/adapters";
import { configureLatency } from "@/adapters/mock/latency";
import { remainingSeats } from "@/domain/selectors";
import { classifyToken } from "@/domain/tickets";
import type { Order, WaitlistEntry } from "@/domain/types";
import { useDbStore } from "@/store/db-store";
import { DEFAULT_FLAGS, useDemoStore } from "@/store/demo-store";
import { cancelOrder } from "./order-service";

async function ed2Orders(): Promise<Order[]> {
  return (await storage.orders.list()).filter((o) => o.editionId === "ed-002" && o.status === "paid");
}

async function seatsLeft(): Promise<number | null> {
  const edition = await storage.editions.get("ed-002");
  if (!edition) throw new Error("edición");
  return remainingSeats(edition, await storage.orders.list());
}

function waiter(n: number, createdAt: string, extra: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: `wl-t${n}`,
    editionId: "ed-002",
    name: `Espera ${n}`,
    email: `espera${n}@ejemplo.com`,
    createdAt,
    notifiedAt: null,
    ...extra,
  };
}

beforeEach(() => {
  configureLatency({ min: 0, max: 0 });
  useDbStore.getState().resetDemo();
  useDemoStore.setState({ ...DEFAULT_FLAGS });
});

describe("order-service · cancelOrder", () => {
  it("cancelar (sin reembolso): orden cancelada, entradas canceladas y cupos liberados", async () => {
    const order = (await ed2Orders()).find((o) => o.lines.reduce((s, l) => s + l.quantity, 0) === 2);
    if (!order) throw new Error("sin orden de 2");
    const before = await seatsLeft();

    const r = await cancelOrder(order.id, { refund: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.status).toBe("cancelled");
    expect(r.freedSeats).toBe(2);
    expect(r.tickets).toHaveLength(2);
    expect(r.tickets.every((t) => t.status === "cancelled")).toBe(true);
    expect((await storage.orders.get(order.id))?.status).toBe("cancelled");
    expect(await seatsLeft()).toBe((before ?? 0) + 2);
  });

  it("reembolsar: la orden queda `refunded`", async () => {
    const order = (await ed2Orders())[0];
    const r = await cancelOrder(order.id, { refund: true });
    expect(r.ok && r.order.status).toBe("refunded");
    expect((await storage.orders.get(order.id))?.status).toBe("refunded");
  });

  it("los QR de una orden cancelada dejan de valer", async () => {
    const order = (await ed2Orders())[0];
    const tickets = (await storage.tickets.list()).filter((t) => t.orderId === order.id);
    await cancelOrder(order.id, { refund: false });
    for (const t of tickets) {
      const after = await storage.tickets.get(t.id);
      expect(classifyToken({ ticketId: t.id, version: t.version }, after)).toBe("cancelled");
    }
  });

  it("solo cancela órdenes pagadas; no se cancela dos veces ni una inexistente", async () => {
    const order = (await ed2Orders())[0];
    expect((await cancelOrder(order.id, { refund: false })).ok).toBe(true);
    const again = await cancelOrder(order.id, { refund: true });
    expect(!again.ok && again.code).toBe("not_paid");
    const ghost = await cancelOrder("ord-no-existe", { refund: false });
    expect(!ghost.ok && ghost.code).toBe("not_found");
  });

  it("avisa a la lista de espera en orden de llegada, tantas personas como cupos se liberaron", async () => {
    // Fuera de orden a propósito: debe ordenar por fecha de alta, no por inserción
    await storage.waitlist.save(waiter(3, "2026-11-03T10:00:00.000Z"));
    await storage.waitlist.save(waiter(1, "2026-11-01T10:00:00.000Z"));
    await storage.waitlist.save(waiter(2, "2026-11-02T10:00:00.000Z"));
    await storage.waitlist.save(waiter(4, "2026-11-04T10:00:00.000Z"));
    const order = (await ed2Orders()).find((o) => o.lines.reduce((s, l) => s + l.quantity, 0) === 2);
    if (!order) throw new Error("sin orden de 2");

    const r = await cancelOrder(order.id, { refund: true });
    if (!r.ok) throw new Error("cancelación");
    await r.followUps;

    expect(r.notified.map((w) => w.id)).toEqual(["wl-t1", "wl-t2"]);
    expect((await storage.waitlist.get("wl-t1"))?.notifiedAt).not.toBeNull();
    expect((await storage.waitlist.get("wl-t2"))?.notifiedAt).not.toBeNull();
    expect((await storage.waitlist.get("wl-t3"))?.notifiedAt).toBeNull();
    expect((await storage.waitlist.get("wl-t4"))?.notifiedAt).toBeNull();

    const sent = (await storage.emails.list()).filter((e) => e.template === "waitlist-available");
    expect(sent.map((e) => e.to).sort()).toEqual(["espera1@ejemplo.com", "espera2@ejemplo.com"]);
    expect(sent.every((e) => e.waitlistEntryId && e.toName?.startsWith("Espera"))).toBe(true);

    // Una segunda cancelación avisa a la siguiente persona, sin repetir a las ya avisadas
    const next = (await ed2Orders()).find((o) => o.id !== order.id);
    if (!next) throw new Error("sin otra orden");
    const r2 = await cancelOrder(next.id, { refund: false });
    if (!r2.ok) throw new Error("cancelación 2");
    await r2.followUps;
    expect(r2.notified[0]?.id).toBe("wl-t3");
    const total = (await storage.emails.list()).filter((e) => e.template === "waitlist-available");
    expect(new Set(total.map((e) => e.to)).size).toBe(total.length);
  });

  it("edición agotada forzada: te anotas, cancelas una orden y la lista recibe el aviso", async () => {
    useDemoStore.setState({ forceSoldOut: true });
    await storage.waitlist.save(waiter(1, new Date().toISOString()));
    const order = (await ed2Orders())[0];
    const r = await cancelOrder(order.id, { refund: true });
    if (!r.ok) throw new Error("cancelación");
    await r.followUps;
    expect(r.notified).toHaveLength(1);
    const mail = (await storage.emails.list()).find((e) => e.template === "waitlist-available");
    expect(mail?.to).toBe("espera1@ejemplo.com");
  });

  it("ed-002 llena al aforo: al cancelar se libera el cupo y avisan a la lista", async () => {
    const edition = await storage.editions.get("ed-002");
    const left = await seatsLeft();
    if (!edition || left === null) throw new Error("edición");
    const tt = (await storage.ticketTypes.list()).find((t) => t.editionId === "ed-002");
    if (!tt) throw new Error("tipo");
    // Llena el aforo con una orden pagada
    const filler: Order = {
      id: "ord-llena",
      editionId: "ed-002",
      status: "paid",
      buyer: { name: "Comprador Lleno", email: "lleno@ejemplo.com" },
      taxId: { kind: "cedula", number: "0912345678" },
      lines: [{ ticketTypeId: tt.id, stageKey: "preventa", unitCents: 1000, quantity: left, isExample: true }],
      couponCode: null,
      subtotalCents: 1000 * left,
      discountCents: 0,
      totalCents: 1000 * left,
      createdAt: new Date().toISOString(),
      reservationExpiresAt: null,
      paidAt: new Date().toISOString(),
      chargeId: "demo_ch_llena",
    };
    await storage.orders.save(filler);
    expect(await seatsLeft()).toBe(0);
    await storage.waitlist.save(waiter(1, "2026-11-01T10:00:00.000Z"));

    const r = await cancelOrder("ord-llena", { refund: true });
    if (!r.ok) throw new Error("cancelación");
    await r.followUps;
    expect(await seatsLeft()).toBe(left);
    expect(r.notified.map((w) => w.id)).toEqual(["wl-t1"]);
  });

  it("no avisa a la lista de una edición pasada", async () => {
    const order = (await storage.orders.list()).find((o) => o.editionId === "ed-001" && o.status === "paid");
    if (!order) throw new Error("sin orden de la ed. 001");
    const r = await cancelOrder(order.id, { refund: false });
    if (!r.ok) throw new Error("cancelación");
    await r.followUps;
    expect(r.notified).toEqual([]);
    expect((await storage.emails.list()).some((e) => e.template === "waitlist-available")).toBe(false);
  });
});
