import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "@/adapters";
import { configureLatency, resetLatency } from "@/adapters/mock/latency";
import { emptyDraft, type CheckoutDraft } from "@/domain/checkout";
import type { Order } from "@/domain/types";
import { remainingSeats } from "@/domain/selectors";
import { verifyTicketToken, createTicketToken } from "@/domain/ticket-token";
import { cedulaCheckDigit } from "@/domain/validation";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { useDbStore } from "@/store/db-store";
import { DEFAULT_FLAGS, RESERVATION_FAST_MS, RESERVATION_MS, useDemoStore } from "@/store/demo-store";
import { expire, pay, previewCoupon, reservationDurationMs, reserve } from "./checkout-service";

const CEDULA_OK = `091234567${cedulaCheckDigit("091234567")}`;

function validDraft(order: Pick<Order, "lines">): CheckoutDraft {
  const draft = emptyDraft(order);
  draft.buyer = { name: "Comprador Demo", email: "comprador@ejemplo.com", phone: "" };
  draft.attendees = draft.attendees.map((_, i) => ({
    name: `Asistente ${i + 1}`,
    email: `asistente${i + 1}@ejemplo.com`,
    answers: { "af-002-talla": "M" },
  }));
  draft.taxId = CEDULA_OK;
  return draft;
}

async function seats(): Promise<number | null> {
  const edition = await storage.editions.get("ed-002");
  if (!edition) throw new Error("edición");
  return remainingSeats(edition, await storage.orders.list());
}

beforeEach(() => {
  configureLatency({ min: 0, max: 0 });
  useDbStore.getState().resetDemo();
  useDemoStore.setState({ ...DEFAULT_FLAGS });
  useCheckoutDraftStore.setState({ drafts: {}, activeOrderByEdition: {} });
});

afterEach(() => {
  vi.useRealTimers();
  resetLatency();
});

describe("checkout-service · reserva", () => {
  it("reserva cupos con el temporizador de 10:00 y el de 30 s si está acelerado", async () => {
    expect(reservationDurationMs()).toBe(RESERVATION_MS);
    const before = await seats();
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 2 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(new Date(r.order.reservationExpiresAt as string).getTime() - new Date(r.order.createdAt).getTime()).toBe(RESERVATION_MS);
    expect(await seats()).toBe((before ?? 0) - 2);

    useDemoStore.setState({ fastReservationTimer: true });
    expect(reservationDurationMs()).toBe(RESERVATION_FAST_MS);
    const fast = await reserve({ editionId: "ed-002", selection: { "tt-002-b": 1 } });
    expect(fast.ok && new Date(fast.order.reservationExpiresAt as string).getTime() - new Date(fast.order.createdAt).getTime()).toBe(RESERVATION_FAST_MS);
  });

  it("una segunda reserva del mismo navegador reemplaza a la anterior", async () => {
    const before = await seats();
    const a = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 2 } });
    const b = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 3 } });
    if (!a.ok || !b.ok) throw new Error("reserva");
    expect((await storage.orders.get(a.order.id))?.status).toBe("expired");
    expect(await seats()).toBe((before ?? 0) - 3);
    expect(useCheckoutDraftStore.getState().activeOrderByEdition["ed-002"]).toBe(b.order.id);
  });

  it("expira la reserva y recupera los cupos; es idempotente", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-06T15:00:00.000Z"));
    const before = await seats();
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 2 } });
    if (!r.ok) throw new Error("reserva");
    expect(await seats()).toBe((before ?? 0) - 2);
    // Al pasar el tiempo los cupos se liberan solos
    vi.setSystemTime(new Date("2026-11-06T15:10:01.000Z"));
    expect(await seats()).toBe(before);
    const expired = await expire(r.order.id);
    expect(expired?.status).toBe("expired");
    expect((await expire(r.order.id))?.status).toBe("expired");
    expect(useCheckoutDraftStore.getState().activeOrderByEdition["ed-002"]).toBeUndefined();
    expect(await expire("ord-no-existe")).toBeUndefined();
  });

  it("rechaza con mensaje cuando la edición está agotada por el interruptor", async () => {
    useDemoStore.setState({ forceSoldOut: true });
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 1 } });
    expect(r.ok).toBe(false);
  });

  it("valida cupones: BOND10 aplica 10 % y XXXX da error", async () => {
    const ok = await previewCoupon("bond10", "ed-002", 2000);
    expect(ok.ok && ok.discountCents).toBe(200);
    const bad = await previewCoupon("XXXX", "ed-002", 2000);
    expect(!bad.ok && bad.message).toMatch(/no existe/);
  });
});

describe("checkout-service · pago", () => {
  it("aprobado: orden pagada, un ticket por asistente con token firmado, cupón usado, factura y correos", async () => {
    const usedBefore = (await storage.coupons.findByCode("BOND10"))?.usedCount ?? 0;
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 2, "tt-002-b": 1 }, couponCode: "BOND10" });
    if (!r.ok) throw new Error("reserva");
    const draft = validDraft(r.order);
    useCheckoutDraftStore.getState().setDraft(r.order.id, draft);

    const result = await pay(r.order.id, draft);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.status).toBe("paid");
    expect(result.tickets).toHaveLength(3);
    for (const t of result.tickets) {
      const parsed = await verifyTicketToken(await createTicketToken(t.id, t.version));
      expect(parsed?.ticketId).toBe(t.id);
    }
    expect((await storage.orders.get(r.order.id))?.status).toBe("paid");
    expect((await storage.tickets.list()).filter((t) => t.orderId === r.order.id)).toHaveLength(3);
    expect((await storage.coupons.findByCode("BOND10"))?.usedCount).toBe(usedBefore + 1);
    expect(useCheckoutDraftStore.getState().drafts[r.order.id]).toBeUndefined();

    await result.followUps;
    const invoice = (await storage.invoices.list()).find((i) => i.orderId === r.order.id);
    expect(invoice?.buyerTaxId).toBe(CEDULA_OK);
    const sent = (await storage.emails.list()).filter((e) => e.orderId === r.order.id && e.template === "ticket");
    expect(sent.map((e) => e.to).sort()).toEqual(["asistente1@ejemplo.com", "asistente2@ejemplo.com", "asistente3@ejemplo.com"]);
  });

  it("rechazado: devuelve el error sin tocar la orden ni el borrador; al apagar el flag aprueba", async () => {
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 1 } });
    if (!r.ok) throw new Error("reserva");
    const draft = validDraft(r.order);
    useCheckoutDraftStore.getState().setDraft(r.order.id, draft);

    useDemoStore.setState({ forcePaymentDecline: true });
    const declined = await pay(r.order.id, draft);
    expect(declined.ok).toBe(false);
    expect(!declined.ok && declined.code).toBe("declined");
    const untouched = await storage.orders.get(r.order.id);
    expect(untouched?.status).toBe("reserved");
    expect(untouched?.chargeId).toBeNull();
    expect(useCheckoutDraftStore.getState().drafts[r.order.id]).toEqual(draft);
    expect((await storage.tickets.list()).some((t) => t.orderId === r.order.id)).toBe(false);

    useDemoStore.setState({ forcePaymentDecline: false });
    expect((await pay(r.order.id, draft)).ok).toBe(true);
  });

  it("no cobra con datos inválidos (cédula 123) y avisa qué campo falla", async () => {
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 1 } });
    if (!r.ok) throw new Error("reserva");
    const result = await pay(r.order.id, { ...validDraft(r.order), taxId: "123" });
    expect(!result.ok && result.code).toBe("invalid");
    expect(!result.ok && result.errors?.taxId).toBeTruthy();
    expect((await storage.orders.get(r.order.id))?.status).toBe("reserved");
  });

  it("con la reserva vencida no cobra, expira la orden y libera los cupos", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-06T15:00:00.000Z"));
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 1 } });
    if (!r.ok) throw new Error("reserva");
    vi.setSystemTime(new Date("2026-11-06T15:11:00.000Z"));
    const result = await pay(r.order.id, validDraft(r.order));
    expect(!result.ok && result.code).toBe("expired");
    expect((await storage.orders.get(r.order.id))?.status).toBe("expired");
  });

  it("un doble clic no cobra dos veces y pagar una orden pagada es idempotente", async () => {
    const r = await reserve({ editionId: "ed-002", selection: { "tt-002-a": 1 } });
    if (!r.ok) throw new Error("reserva");
    const draft = validDraft(r.order);
    const [one, two] = await Promise.all([pay(r.order.id, draft), pay(r.order.id, draft)]);
    expect(one).toBe(two);
    const again = await pay(r.order.id, draft);
    expect(again.ok && again.tickets).toHaveLength(1);
    expect((await storage.tickets.list()).filter((t) => t.orderId === r.order.id)).toHaveLength(1);
    expect(await pay("ord-no-existe", draft)).toMatchObject({ ok: false, code: "not_found" });
  });
});
