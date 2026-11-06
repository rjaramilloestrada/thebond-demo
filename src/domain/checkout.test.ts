import { describe, expect, it } from "vitest";
import {
  attendeeSlots,
  availableFor,
  availableForCounts,
  buildReservation,
  couponDiscountLabel,
  emptyDraft,
  expireStale,
  fieldKey,
  finalizePaidOrder,
  isReservationExpired,
  reconcileDraft,
  reservationRemainingMs,
  selectableMax,
  validateCheckoutForm,
  type CheckoutDraft,
} from "./checkout";
import { seed } from "@/seed/seed";
import { cedulaCheckDigit } from "./validation";
import { verifyTicketToken, createTicketToken } from "./ticket-token";
import type { Order, TicketType } from "./types";

const NOW = new Date("2026-11-06T15:00:00.000Z");
const MIN = 60_000;

function cedula(first9: string): string {
  return `${first9}${cedulaCheckDigit(first9)}`;
}
const CEDULA_OK = cedula("091234567");
const RUC_OK = `${CEDULA_OK}001`;

function data() {
  const s = seed(NOW);
  const edition = s.editions["ed-002"];
  const ticketTypes = Object.values(s.ticketTypes).filter((t) => t.editionId === "ed-002");
  const orders = Object.values(s.orders);
  const coupons = Object.values(s.coupons);
  const fields = Object.values(s.attendeeFields).filter((f) => f.editionId === "ed-002");
  return { edition, ticketTypes, orders, coupons, fields };
}

function validDraft(order: Pick<Order, "lines">): CheckoutDraft {
  const draft = emptyDraft(order);
  draft.buyer = { name: "Comprador Demo", email: "comprador@ejemplo.com", phone: "" };
  draft.attendees = draft.attendees.map((_, i) => ({
    name: `Asistente ${String(i + 1).padStart(2, "0")}`,
    email: `asistente${String(i + 1).padStart(2, "0")}@ejemplo.com`,
    answers: { "af-002-talla": "M" },
  }));
  draft.taxId = CEDULA_OK;
  return draft;
}

describe("availableFor", () => {
  it("es el mínimo entre cupos del tipo, cupo de la etapa activa y aforo de la edición", () => {
    const { edition, ticketTypes, orders } = data();
    const a = ticketTypes.find((t) => t.id === "tt-002-a") as TicketType;
    // Semilla: A vendió 4 (preventa, cuota 10) → quedan 6 en la etapa; tipo 40-4=36; aforo 60-7=53
    expect(availableFor(a, orders, edition, NOW)).toBe(6);
  });

  it("topa por el aforo de la edición cuando es lo más chico", () => {
    expect(
      availableForCounts({
        ticketType: { capacity: 40, stages: [{ key: "general", label: "G", amountCents: 1, isExample: true, quota: null, endsAt: null }] },
        soldOfType: 0,
        editionRemaining: 3,
        now: NOW,
      }),
    ).toBe(3);
  });

  it("topa por los cupos del tipo y es null si todo es ilimitado", () => {
    const open = { key: "general", label: "G", amountCents: 1, isExample: true, quota: null, endsAt: null } as const;
    expect(availableForCounts({ ticketType: { capacity: 10, stages: [open] }, soldOfType: 7, editionRemaining: null, now: NOW })).toBe(3);
    expect(availableForCounts({ ticketType: { capacity: null, stages: [open] }, soldOfType: 7, editionRemaining: null, now: NOW })).toBeNull();
  });

  it("es 0 sin etapa activa y una reserva vigente cuenta como vendida", () => {
    const { edition, ticketTypes, orders } = data();
    const b = ticketTypes.find((t) => t.id === "tt-002-b") as TicketType;
    // B vendió 3 de 5 en preventa: quedan 2 en la etapa
    const before = availableFor(b, orders, edition, NOW);
    expect(before).toBe(2);
    const r = buildReservation({ edition, ticketTypes, orders, selection: { "tt-002-b": 2 }, durationMs: 10 * MIN, now: NOW, id: "ord-x" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Al reservar los 2 últimos de preventa, la etapa activa pasa a General (10 cupos)
    expect(availableFor(b, [...orders, r.order], edition, NOW)).toBe(10);
    expect(availableFor(b, [...orders, r.order], edition, new Date(NOW.getTime() + 11 * MIN))).toBe(before);
    const exhausted = { ...b, stages: b.stages.map((s) => ({ ...s, endsAt: "2026-01-01T00:00:00.000Z" })) };
    expect(availableFor(exhausted, orders, edition, NOW)).toBe(0);
  });

  it("selectableMax respeta maxPerOrder y la disponibilidad", () => {
    expect(selectableMax({ maxPerOrder: 4 }, 2)).toBe(2);
    expect(selectableMax({ maxPerOrder: 4 }, 9)).toBe(4);
    expect(selectableMax({ maxPerOrder: 4 }, null)).toBe(4);
  });
});

describe("buildReservation", () => {
  it("crea una orden reserved con vencimiento y fija la etapa activa", () => {
    const { edition, ticketTypes, orders, coupons } = data();
    const r = buildReservation({
      edition, ticketTypes, orders, coupons,
      selection: { "tt-002-a": 2, "tt-002-b": 1 },
      durationMs: 10 * MIN, now: NOW, id: "ord-test",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.status).toBe("reserved");
    expect(r.order.reservationExpiresAt).toBe(new Date(NOW.getTime() + 10 * MIN).toISOString());
    expect(r.order.lines.map((l) => [l.ticketTypeId, l.stageKey, l.quantity])).toEqual([
      ["tt-002-a", "preventa", 2],
      ["tt-002-b", "preventa", 1],
    ]);
    expect(r.order.subtotalCents).toBe(2 * 1000 + 2000);
    expect(r.order.totalCents).toBe(r.order.subtotalCents);
    expect(r.order.lines.every((l) => l.isExample)).toBe(true);
  });

  it("aplica BOND10 (10 %) y rechaza un cupón inválido con mensaje", () => {
    const { edition, ticketTypes, orders, coupons } = data();
    const ok = buildReservation({ edition, ticketTypes, orders, coupons, selection: { "tt-002-b": 1 }, couponCode: "bond10", durationMs: MIN, now: NOW });
    expect(ok.ok && ok.order.discountCents).toBe(200);
    expect(ok.ok && ok.order.totalCents).toBe(1800);
    expect(ok.ok && ok.order.couponCode).toBe("BOND10");
    const bad = buildReservation({ edition, ticketTypes, orders, coupons, selection: { "tt-002-b": 1 }, couponCode: "XXXX", durationMs: MIN, now: NOW });
    expect(bad).toEqual({ ok: false, message: expect.stringContaining("no existe") });
  });

  it("rechaza sin selección, sobre el máximo, sin cupo y en edición agotada o pasada", () => {
    const { edition, ticketTypes, orders } = data();
    const base = { edition, ticketTypes, orders, durationMs: MIN, now: NOW };
    expect(buildReservation({ ...base, selection: {} })).toEqual({ ok: false, message: "Elige al menos una entrada." });
    const over = buildReservation({ ...base, selection: { "tt-002-a": 5 } });
    expect(!over.ok && over.message).toMatch(/Máximo 4/);
    // A tiene 6 cupos en preventa: 4 caben y una segunda orden de 3 ya no
    const first = buildReservation({ ...base, selection: { "tt-002-a": 4 }, id: "ord-1" });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = buildReservation({ ...base, orders: [...orders, first.order], selection: { "tt-002-a": 3 } });
    expect(!second.ok && second.message).toMatch(/Solo quedan 2/);
    expect(buildReservation({ ...base, selection: { "tt-002-a": 1 }, forceSoldOut: true }).ok).toBe(false);
    expect(buildReservation({ ...base, edition: { ...edition, soldOut: true }, selection: { "tt-002-a": 1 } }).ok).toBe(false);
    expect(buildReservation({ ...base, edition: { ...edition, isPast: true }, selection: { "tt-002-a": 1 } }).ok).toBe(false);
  });
});

describe("expireStale", () => {
  it("solo vence las reservas pasadas de hora y deja intactas las demás", () => {
    const { edition, ticketTypes, orders } = data();
    const r = buildReservation({ edition, ticketTypes, orders, selection: { "tt-002-a": 1 }, durationMs: 10 * MIN, now: NOW, id: "ord-r" });
    if (!r.ok) throw new Error("reserva");
    const all = [...orders, r.order];
    const before = expireStale(all, new Date(NOW.getTime() + 9 * MIN));
    expect(before.find((o) => o.id === "ord-r")?.status).toBe("reserved");
    const after = expireStale(all, new Date(NOW.getTime() + 10 * MIN));
    expect(after.find((o) => o.id === "ord-r")?.status).toBe("expired");
    expect(after.filter((o, i) => o !== all[i]).map((o) => o.id)).toEqual(["ord-r"]);
    expect(isReservationExpired(r.order, new Date(NOW.getTime() + 10 * MIN))).toBe(true);
    expect(reservationRemainingMs(r.order, new Date(NOW.getTime() + 4 * MIN))).toBe(6 * MIN);
    expect(reservationRemainingMs(after.find((o) => o.id === "ord-r") as Order, NOW)).toBe(0);
  });
});

describe("validateCheckoutForm", () => {
  const { fields } = data();
  const order = { lines: [{ ticketTypeId: "tt-002-a", stageKey: "preventa" as const, unitCents: 1000, quantity: 2, isExample: true }] };

  it("acepta un borrador completo con cédula válida y con RUC válido", () => {
    const draft = validDraft(order);
    expect(validateCheckoutForm(draft, fields)).toEqual({ valid: true, errors: {} });
    expect(validateCheckoutForm({ ...draft, taxId: RUC_OK }, fields).valid).toBe(true);
  });

  it("rechaza 123, cédula con verificador malo y RUC de 12 dígitos", () => {
    const draft = validDraft(order);
    const wrongDigit = `${CEDULA_OK.slice(0, 9)}${(Number(CEDULA_OK[9]) + 1) % 10}`;
    for (const taxId of ["123", wrongDigit, RUC_OK.slice(0, 12), "", "09123abc67"]) {
      const v = validateCheckoutForm({ ...draft, taxId }, fields);
      expect(v.valid).toBe(false);
      expect(v.errors[fieldKey.taxId]).toBeTruthy();
    }
  });

  it("pide los datos por asistente y los campos requeridos, en orden de formulario", () => {
    const v = validateCheckoutForm(emptyDraft(order), fields);
    expect(v.valid).toBe(false);
    expect(Object.keys(v.errors)).toEqual([
      "buyer.name",
      "buyer.email",
      "attendees.0.name",
      "attendees.0.email",
      "attendees.0.answers.af-002-talla",
      "attendees.1.name",
      "attendees.1.email",
      "attendees.1.answers.af-002-talla",
      "taxId",
    ]);
    // El nivel no es obligatorio
    expect(v.errors["attendees.0.answers.af-002-nivel"]).toBeUndefined();
  });

  it("valida correo, teléfono opcional y opciones de listas", () => {
    const draft = validDraft(order);
    draft.buyer.email = "no-es-correo";
    draft.buyer.phone = "abc";
    draft.attendees[1].answers["af-002-talla"] = "XXXL";
    const v = validateCheckoutForm(draft, fields);
    expect(Object.keys(v.errors)).toEqual(["buyer.email", "buyer.phone", "attendees.1.answers.af-002-talla"]);
    draft.buyer.phone = "+593 99 123 4567";
    expect(validateCheckoutForm(draft, fields).errors["buyer.phone"]).toBeUndefined();
  });
});

describe("borrador", () => {
  it("un asistente por entrada, en orden de líneas, y se reconcilia conservando lo escrito", () => {
    const order = {
      lines: [
        { ticketTypeId: "tt-002-a", stageKey: "preventa" as const, unitCents: 1000, quantity: 2, isExample: true },
        { ticketTypeId: "tt-002-b", stageKey: "preventa" as const, unitCents: 2000, quantity: 1, isExample: true },
      ],
    };
    expect(attendeeSlots(order)).toEqual(["tt-002-a", "tt-002-a", "tt-002-b"]);
    const draft = emptyDraft(order);
    expect(draft.attendees).toHaveLength(3);
    draft.attendees[0].name = "Asistente 01";
    const smaller = { lines: [{ ...order.lines[0], quantity: 1 }] };
    expect(reconcileDraft(smaller, draft).attendees).toHaveLength(1);
    expect(reconcileDraft(smaller, draft).attendees[0].name).toBe("Asistente 01");
  });
});

describe("finalizePaidOrder", () => {
  it("pasa la orden a paid y crea 1 ticket por asistente (versión 1) con QR firmable", async () => {
    const { edition, ticketTypes, orders, coupons } = data();
    const r = buildReservation({ edition, ticketTypes, orders, coupons, selection: { "tt-002-a": 2, "tt-002-b": 1 }, durationMs: 10 * MIN, now: NOW, id: "ord-pay" });
    if (!r.ok) throw new Error("reserva");
    const draft = validDraft(r.order);
    const { order, tickets } = finalizePaidOrder(r.order, { chargeId: "demo_ch_1", approvedAt: NOW.toISOString() }, draft);
    expect(order.status).toBe("paid");
    expect(order.chargeId).toBe("demo_ch_1");
    expect(order.reservationExpiresAt).toBeNull();
    expect(order.taxId).toEqual({ kind: "cedula", number: CEDULA_OK });
    expect(order.buyer.email).toBe("comprador@ejemplo.com");
    expect(tickets).toHaveLength(3);
    expect(new Set(tickets.map((t) => t.id)).size).toBe(3);
    expect(tickets.map((t) => t.ticketTypeId)).toEqual(["tt-002-a", "tt-002-a", "tt-002-b"]);
    expect(tickets.every((t) => t.version === 1 && t.status === "valid" && t.orderId === "ord-pay")).toBe(true);
    expect(tickets[1].attendee).toEqual({ name: "Asistente 02", email: "asistente02@ejemplo.com", answers: { "af-002-talla": "M" } });
    const token = await createTicketToken(tickets[0].id, tickets[0].version);
    expect(await verifyTicketToken(token)).toEqual({ ticketId: tickets[0].id, version: 1 });
    const ruc = finalizePaidOrder(r.order, { chargeId: "c", approvedAt: NOW.toISOString() }, { ...draft, taxId: RUC_OK });
    expect(ruc.order.taxId.kind).toBe("ruc");
  });
});

describe("couponDiscountLabel", () => {
  const money = (c: number) => `$${c / 100}`;
  it("muestra −10 % y, para montos, −$XX cuando el total es de ejemplo", () => {
    expect(couponDiscountLabel({ kind: "percent", value: 10 }, true, money)).toBe("−10 %");
    expect(couponDiscountLabel({ kind: "amount", value: 500 }, true, money)).toBe("−$XX");
    expect(couponDiscountLabel({ kind: "amount", value: 500 }, false, money)).toBe("−$5");
  });
});
