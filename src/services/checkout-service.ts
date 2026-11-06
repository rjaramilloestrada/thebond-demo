/**
 * Servicio de compra: orquesta los adapters (`@/adapters`) para reservar, pagar
 * y expirar una orden. Las pantallas llaman aquí; ninguna escribe datos de
 * negocio en el store. La lógica pura vive en `@/domain/checkout`.
 */
import { emails, invoices, payments, storage } from "@/adapters";
import {
  applyDraftToOrder,
  buildReservation,
  expireStale,
  finalizePaidOrder,
  isReservationExpired,
  validateCheckoutForm,
  type CheckoutDraft,
  type FormErrors,
  type Selection,
} from "@/domain/checkout";
import { applyCoupon, type CouponResult } from "@/domain/pricing";
import type { ID, Order, Ticket } from "@/domain/types";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { RESERVATION_FAST_MS, RESERVATION_MS, useDemoStore } from "@/store/demo-store";

/* ───────────── Reserva ───────────── */

export type ReserveResult = { ok: true; order: Order } | { ok: false; message: string };

/** Duración de la reserva según el interruptor de demo (10:00 o 30 s). */
export function reservationDurationMs(): number {
  return useDemoStore.getState().fastReservationTimer ? RESERVATION_FAST_MS : RESERVATION_MS;
}

/** Valida un código de cupón contra los cupones guardados (para el selector). */
export async function previewCoupon(code: string, editionId: ID, subtotalCents: number): Promise<CouponResult> {
  const coupons = await storage.coupons.list();
  return applyCoupon({ code, coupons, subtotalCents, editionId });
}

/**
 * Reserva los cupos: crea una orden `reserved` con vencimiento. Si este
 * navegador ya tenía una reserva en curso de la misma edición, la reemplaza
 * (la anterior queda `expired` y libera sus cupos).
 */
export async function reserve(params: {
  editionId: ID;
  selection: Selection;
  couponCode?: string | null;
}): Promise<ReserveResult> {
  const { editionId, selection, couponCode = null } = params;
  const edition = await storage.editions.get(editionId);
  if (!edition) return { ok: false, message: "No encontramos esta edición." };

  const drafts = useCheckoutDraftStore.getState();
  const previousId = drafts.activeOrderByEdition[editionId];
  if (previousId) await expire(previousId);

  const now = new Date();
  const [ticketTypes, allOrders, coupons] = await Promise.all([
    storage.ticketTypes.list(),
    storage.orders.list(),
    storage.coupons.list(),
  ]);

  // Limpia reservas vencidas de cualquier comprador (sus cupos ya estaban libres)
  const swept = expireStale(allOrders, now);
  await Promise.all(swept.filter((o, i) => o !== allOrders[i]).map((o) => storage.orders.save(o)));

  const result = buildReservation({
    edition,
    ticketTypes,
    orders: swept,
    selection,
    couponCode,
    coupons,
    now,
    durationMs: reservationDurationMs(),
    forceSoldOut: useDemoStore.getState().forceSoldOut,
  });
  if (!result.ok) return result;

  await storage.orders.save(result.order);
  drafts.setActiveOrder(editionId, result.order.id);
  return result;
}

/** Marca la reserva como vencida y libera los cupos. Idempotente. */
export async function expire(orderId: ID): Promise<Order | undefined> {
  const order = await storage.orders.get(orderId);
  if (!order) return undefined;
  const drafts = useCheckoutDraftStore.getState();
  if (order.status !== "reserved") {
    drafts.clearActiveOrder(order.editionId, orderId);
    return order;
  }
  const expired: Order = { ...order, status: "expired", reservationExpiresAt: null };
  await storage.orders.save(expired);
  drafts.clearDraft(orderId);
  drafts.clearActiveOrder(order.editionId, orderId);
  return expired;
}

/* ───────────── Pago ───────────── */

export type PayResult =
  | {
      ok: true;
      order: Order;
      tickets: Ticket[];
      /** Factura y correos: se registran en segundo plano; la promesa nunca rechaza */
      followUps: Promise<void>;
    }
  | { ok: false; code: "not_found" | "expired" | "invalid" | "declined" | "error"; message: string; errors?: FormErrors };

const inFlight = new Map<ID, Promise<PayResult>>();

/**
 * Cobra la orden en la caja de pagos. Si la caja rechaza, devuelve el error sin
 * tocar la orden (los datos quedan para reintentar). Si aprueba: orden `paid`,
 * una entrada por asistente, cupón usado, factura y correos (registro).
 */
export function pay(orderId: ID, draft: CheckoutDraft): Promise<PayResult> {
  const running = inFlight.get(orderId);
  if (running) return running;
  const task = runPay(orderId, draft).finally(() => inFlight.delete(orderId));
  inFlight.set(orderId, task);
  return task;
}

async function runPay(orderId: ID, draft: CheckoutDraft): Promise<PayResult> {
  const order = await storage.orders.get(orderId);
  if (!order) return { ok: false, code: "not_found", message: "No encontramos esta orden." };
  if (order.status === "paid") {
    const tickets = (await storage.tickets.list()).filter((t) => t.orderId === orderId);
    return { ok: true, order, tickets, followUps: Promise.resolve() };
  }
  if (order.status !== "reserved" || isReservationExpired(order)) {
    await expire(orderId);
    return { ok: false, code: "expired", message: "Tu reserva venció y liberamos los cupos." };
  }

  const fields = (await storage.attendeeFields.list()).filter((f) => f.editionId === order.editionId);
  const check = validateCheckoutForm(draft, fields);
  if (!check.valid) {
    return { ok: false, code: "invalid", message: "Revisa los datos marcados antes de pagar.", errors: check.errors };
  }

  const charge = await payments.createCharge(applyDraftToOrder(order, draft));
  if (!charge.ok) return { ok: false, code: charge.code === "declined" ? "declined" : "error", message: charge.message };

  const { order: paid, tickets } = finalizePaidOrder(order, charge, draft);
  await storage.orders.save(paid);
  for (const ticket of tickets) await storage.tickets.save(ticket);

  if (paid.couponCode) {
    const coupon = await storage.coupons.findByCode(paid.couponCode);
    if (coupon) await storage.coupons.save({ ...coupon, usedCount: coupon.usedCount + 1 });
  }

  const drafts = useCheckoutDraftStore.getState();
  drafts.clearDraft(orderId);
  drafts.clearActiveOrder(order.editionId, orderId);

  const followUps = (async () => {
    try {
      const invoice = await invoices.issue(paid, paid.taxId);
      if (invoice.ok) await storage.invoices.save(invoice.invoice);
      // Quien compra recibe un correo con TODAS las entradas (un QR por asistente);
      // cada asistente con otro correo recibe además el suyo, con su propio QR.
      const refs = (ts: Ticket[]) => ts.map((t) => ({ ticketId: t.id, version: t.version, attendeeName: t.attendee.name }));
      const buyerEmail = paid.buyer.email.toLowerCase();
      await emails.send("ticket", paid.buyer.email, {
        orderId: paid.id,
        toName: paid.buyer.name,
        ticketRefs: refs(tickets),
      });
      await Promise.all(
        tickets
          .filter((t) => t.attendee.email.toLowerCase() !== buyerEmail)
          .map((t) =>
            emails.send("ticket", t.attendee.email, {
              orderId: paid.id,
              ticketId: t.id,
              toName: t.attendee.name,
              ticketRefs: refs([t]),
            }),
          ),
      );
    } catch {
      // Son registros de demo: un fallo aquí no debe afectar la compra ya cobrada
    }
  })();

  return { ok: true, order: paid, tickets, followUps };
}
