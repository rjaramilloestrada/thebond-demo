/**
 * Lógica pura del flujo de compra (brief 6.2): disponibilidad, reserva,
 * vencimiento, validación del formulario y cierre de una orden pagada.
 * Sin React, sin store y sin adapters: el servicio de compra
 * (`src/services/checkout-service.ts`) la orquesta.
 *
 * Reglas: dinero en centavos, fechas ISO 8601. Las líneas de una orden fijan la
 * etapa activa al momento de reservar.
 */
import { applyCoupon, computeTotals, getStageStatuses } from "./pricing";
import { remainingSeats, soldCount } from "./selectors";
import type {
  Attendee,
  AttendeeField,
  Buyer,
  Coupon,
  Edition,
  ID,
  Order,
  OrderLine,
  Ticket,
  TicketType,
} from "./types";
import { isValidEmail, validateTaxId } from "./validation";

/* ───────────── Selección ───────────── */

/** Cantidad elegida por tipo de entrada (ticketTypeId → cantidad). */
export type Selection = Record<ID, number>;

export function selectionQuantity(selection: Selection): number {
  return Object.values(selection).reduce((sum, q) => sum + (Number.isFinite(q) && q > 0 ? q : 0), 0);
}

/* ───────────── Disponibilidad ───────────── */

type Table<T> = Record<ID, T> | readonly T[];

/**
 * Entradas que se pueden reservar de un tipo, dado lo ya vendido. Es el mínimo
 * entre: cupos del tipo, cupo restante de la etapa activa y aforo restante de la
 * edición. `null` = sin tope (todo pendiente). Sin etapa activa = 0.
 */
export function availableForCounts(params: {
  ticketType: Pick<TicketType, "capacity" | "stages">;
  /** Vendidas (o reservadas) de este tipo */
  soldOfType: number;
  /** Aforo restante de la edición; `null` si el aforo es pendiente */
  editionRemaining: number | null;
  now?: Date;
}): number | null {
  const { ticketType, soldOfType, editionRemaining, now = new Date() } = params;
  const statuses = getStageStatuses(ticketType.stages, soldOfType, now);
  const activeIndex = statuses.findIndex((s) => s.status === "active");
  if (activeIndex === -1) return 0;

  const limits: number[] = [];
  if (ticketType.capacity !== null) limits.push(ticketType.capacity - soldOfType);
  if (editionRemaining !== null) limits.push(editionRemaining);

  // Cupo restante de la etapa activa: cuota acumulada hasta ella menos lo vendido
  let cumulative = 0;
  let unlimited = false;
  for (let i = 0; i <= activeIndex; i++) {
    const quota = statuses[i].stage.quota;
    if (quota === null) unlimited = true;
    else cumulative += quota;
  }
  if (!unlimited) limits.push(cumulative - soldOfType);

  if (limits.length === 0) return null;
  return Math.max(0, Math.min(...limits));
}

/** `availableForCounts` calculado desde la lista de órdenes y la edición. */
export function availableFor(
  ticketType: TicketType,
  orders: Table<Order>,
  edition: Pick<Edition, "id" | "capacity">,
  now: Date = new Date(),
): number | null {
  return availableForCounts({
    ticketType,
    soldOfType: soldCount(orders, edition.id, { ticketTypeId: ticketType.id, now }),
    editionRemaining: remainingSeats(edition, orders, now),
    now,
  });
}

/** Tope seleccionable en pantalla: el menor entre `maxPerOrder` y la disponibilidad. */
export function selectableMax(ticketType: Pick<TicketType, "maxPerOrder">, available: number | null): number {
  return available === null ? ticketType.maxPerOrder : Math.min(ticketType.maxPerOrder, available);
}

/**
 * Líneas de la selección con la etapa activa de cada tipo (para el resumen
 * antes de reservar). Las cantidades ≤ 0 se omiten.
 */
export function previewLines(
  ticketTypes: readonly TicketType[],
  selection: Selection,
  soldByType: Record<ID, number>,
  now: Date = new Date(),
): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const tt of ticketTypes) {
    const quantity = selection[tt.id] ?? 0;
    if (!(quantity > 0)) continue;
    const stage = getStageStatuses(tt.stages, soldByType[tt.id] ?? 0, now).find((x) => x.status === "active")?.stage;
    if (!stage) continue;
    lines.push({ ticketTypeId: tt.id, stageKey: stage.key, unitCents: stage.amountCents, quantity, isExample: stage.isExample });
  }
  return lines;
}

/* ───────────── Reserva ───────────── */

export type ReservationResult = { ok: true; order: Order } | { ok: false; message: string };

export function orderId(now: Date = new Date(), rand: () => number = Math.random): string {
  return `ord-${now.getTime().toString(36)}${Math.floor(rand() * 36 ** 3)
    .toString(36)
    .padStart(3, "0")}`;
}

/**
 * Crea una orden `reserved` con vencimiento. Rechaza (con mensaje en español) si
 * la edición no está a la venta, la selección es inválida, no hay cupo o el
 * cupón no es válido.
 */
export function buildReservation(params: {
  edition: Edition;
  ticketTypes: TicketType[];
  orders: Table<Order>;
  selection: Selection;
  couponCode?: string | null;
  coupons?: Coupon[];
  now?: Date;
  durationMs: number;
  id?: ID;
  forceSoldOut?: boolean;
}): ReservationResult {
  const { edition, ticketTypes, orders, selection, couponCode = null, coupons = [], durationMs, forceSoldOut } = params;
  const now = params.now ?? new Date();

  if (edition.status !== "published" || edition.isPast) {
    return { ok: false, message: "Esta edición no está a la venta." };
  }
  if (edition.soldOut || forceSoldOut) {
    return { ok: false, message: "Esta edición está agotada. Puedes anotarte en la lista de espera." };
  }

  const lines: OrderLine[] = [];
  for (const tt of ticketTypes.filter((t) => t.editionId === edition.id)) {
    const quantity = selection[tt.id] ?? 0;
    if (quantity === 0) continue;
    if (!Number.isInteger(quantity) || quantity < 0) {
      return { ok: false, message: "La cantidad de entradas no es válida." };
    }
    if (quantity > tt.maxPerOrder) {
      return { ok: false, message: `Máximo ${tt.maxPerOrder} entradas de «${tt.name}» por orden.` };
    }
    const available = availableFor(tt, orders, edition, now);
    if (available !== null && quantity > available) {
      return {
        ok: false,
        message:
          available === 0
            ? `Ya no quedan cupos de «${tt.name}».`
            : `Solo quedan ${available} cupos de «${tt.name}». Ajusta la cantidad.`,
      };
    }
    const sold = soldCount(orders, edition.id, { ticketTypeId: tt.id, now });
    const stage = getStageStatuses(tt.stages, sold, now).find((s) => s.status === "active")?.stage;
    if (!stage) return { ok: false, message: `Ya no quedan cupos de «${tt.name}».` };
    lines.push({
      ticketTypeId: tt.id,
      stageKey: stage.key,
      unitCents: stage.amountCents,
      quantity,
      isExample: stage.isExample,
    });
  }
  if (lines.length === 0) return { ok: false, message: "Elige al menos una entrada." };

  const preTotals = computeTotals(lines);
  let discountCents = 0;
  let appliedCode: string | null = null;
  if (couponCode && couponCode.trim()) {
    const result = applyCoupon({
      code: couponCode,
      coupons,
      subtotalCents: preTotals.subtotalCents,
      editionId: edition.id,
      now,
    });
    if (!result.ok) return { ok: false, message: result.message };
    discountCents = result.discountCents;
    appliedCode = result.coupon.code;
  }
  const totals = computeTotals(lines, discountCents);

  const order: Order = {
    id: params.id ?? orderId(now),
    editionId: edition.id,
    status: "reserved",
    buyer: { name: "", email: "" },
    taxId: { kind: "cedula", number: "" },
    lines,
    couponCode: appliedCode,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    totalCents: totals.totalCents,
    createdAt: now.toISOString(),
    reservationExpiresAt: new Date(now.getTime() + durationMs).toISOString(),
    paidAt: null,
    chargeId: null,
  };
  return { ok: true, order };
}

/** ¿La reserva de esta orden ya venció? (solo aplica a órdenes `reserved`) */
export function isReservationExpired(order: Order, now: Date = new Date()): boolean {
  return (
    order.status === "reserved" &&
    (order.reservationExpiresAt === null || new Date(order.reservationExpiresAt).getTime() <= now.getTime())
  );
}

/** Milisegundos que le quedan a una reserva vigente (0 si venció o no aplica). */
export function reservationRemainingMs(order: Order, now: Date = new Date()): number {
  if (order.status !== "reserved" || order.reservationExpiresAt === null) return 0;
  return Math.max(0, new Date(order.reservationExpiresAt).getTime() - now.getTime());
}

/**
 * Las órdenes `reserved` con la reserva vencida pasan a `expired`. Las demás se
 * devuelven sin cambios (misma referencia). Los cupos ya se liberan solos por
 * `holdsSeats`; esto deja el estado explícito.
 */
export function expireStale(orders: readonly Order[], now: Date = new Date()): Order[] {
  return orders.map((o) => (isReservationExpired(o, now) ? { ...o, status: "expired", reservationExpiresAt: null } : o));
}

/* ───────────── Borrador y formulario ───────────── */

export interface AttendeeDraft {
  name: string;
  email: string;
  /** fieldId → valor */
  answers: Record<ID, string>;
}

export interface BuyerDraft {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutDraft {
  buyer: BuyerDraft;
  /** Un asistente por entrada, en el orden de `attendeeSlots(order)` */
  attendees: AttendeeDraft[];
  /** Cédula o RUC, solo dígitos */
  taxId: string;
}

/** Tipo de entrada de cada asistente, en orden de las líneas de la orden. */
export function attendeeSlots(order: Pick<Order, "lines">): ID[] {
  return order.lines.flatMap((l) => Array.from({ length: l.quantity }, () => l.ticketTypeId));
}

export function emptyDraft(order: Pick<Order, "lines">): CheckoutDraft {
  return {
    buyer: { name: "", email: "", phone: "" },
    attendees: attendeeSlots(order).map(() => ({ name: "", email: "", answers: {} })),
    taxId: "",
  };
}

/**
 * Ajusta un borrador guardado al número de asistentes de la orden (por si la
 * cantidad cambió) conservando lo ya escrito.
 */
export function reconcileDraft(order: Pick<Order, "lines">, stored: CheckoutDraft | undefined): CheckoutDraft {
  const base = emptyDraft(order);
  if (!stored) return base;
  return {
    buyer: { ...base.buyer, ...stored.buyer },
    attendees: base.attendees.map((a, i) => ({ ...a, ...(stored.attendees[i] ?? {}) })),
    taxId: stored.taxId ?? "",
  };
}

export type FormErrors = Record<string, string>;

export interface FormValidation {
  valid: boolean;
  /** Claves en el orden del formulario (la primera es la que recibe el foco) */
  errors: FormErrors;
}

/** Claves de campo: `buyer.name`, `attendees.0.answers.<fieldId>`, `taxId`, … */
export const fieldKey = {
  buyer: (f: "name" | "email" | "phone") => `buyer.${f}`,
  attendee: (i: number, f: "name" | "email") => `attendees.${i}.${f}`,
  answer: (i: number, fieldId: ID) => `attendees.${i}.answers.${fieldId}`,
  taxId: "taxId",
} as const;

const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

function nameError(value: string, who: string): string | undefined {
  const v = value.trim();
  if (v.length < 2) return `Escribe ${who} (mínimo 2 letras).`;
  if (v.length > 80) return "El nombre es demasiado largo.";
  return undefined;
}

/**
 * Valida comprador, asistentes (nombre, correo y campos requeridos de la
 * edición) y cédula o RUC. Mensajes en español, por campo.
 */
export function validateCheckoutForm(draft: CheckoutDraft, fields: readonly AttendeeField[]): FormValidation {
  const errors: FormErrors = {};

  const buyerName = nameError(draft.buyer.name, "tu nombre");
  if (buyerName) errors[fieldKey.buyer("name")] = buyerName;
  if (!isValidEmail(draft.buyer.email)) {
    errors[fieldKey.buyer("email")] = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  }
  if (draft.buyer.phone.trim() && !PHONE_RE.test(draft.buyer.phone.trim())) {
    errors[fieldKey.buyer("phone")] = "Escribe un teléfono válido (solo números) o déjalo vacío.";
  }

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  draft.attendees.forEach((a, i) => {
    const n = i + 1;
    const err = nameError(a.name, `el nombre de la asistente ${n}`);
    if (err) errors[fieldKey.attendee(i, "name")] = err;
    if (!isValidEmail(a.email)) {
      errors[fieldKey.attendee(i, "email")] = `Escribe un correo válido para la asistente ${n}.`;
    }
    for (const f of sortedFields) {
      const value = (a.answers[f.id] ?? "").trim();
      if (f.required && !value) {
        errors[fieldKey.answer(i, f.id)] = f.type === "select" ? "Elige una opción." : "Completa este campo.";
      } else if (value && f.type === "select" && !f.options.includes(value)) {
        errors[fieldKey.answer(i, f.id)] = "Elige una de las opciones de la lista.";
      }
    }
  });

  const tax = validateTaxId(draft.taxId);
  if (!tax.valid) errors[fieldKey.taxId] = tax.message;

  return { valid: Object.keys(errors).length === 0, errors };
}

/* ───────────── Pago aprobado ───────────── */

export interface ChargeApproval {
  chargeId: string;
  approvedAt: string;
}

export function ticketIdFor(orderIdValue: ID, index: number): ID {
  return `tk-${orderIdValue.replace(/^ord-/, "")}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Pasa la orden a `paid` con los datos del comprador y crea 1 `Ticket` por
 * asistente (versión 1). Los datos de la orden salen del borrador ya validado.
 */
export function finalizePaidOrder(
  order: Order,
  charge: ChargeApproval,
  draft: CheckoutDraft,
): { order: Order; tickets: Ticket[] } {
  const paid: Order = {
    ...applyDraftToOrder(order, draft),
    status: "paid",
    reservationExpiresAt: null,
    paidAt: charge.approvedAt,
    chargeId: charge.chargeId,
  };

  const slots = attendeeSlots(order);
  const tickets: Ticket[] = slots.map((ticketTypeId, i) => {
    const a = draft.attendees[i];
    const attendee: Attendee = {
      name: a.name.trim(),
      email: a.email.trim().toLowerCase(),
      answers: Object.fromEntries(Object.entries(a.answers).filter(([, v]) => v.trim() !== "")),
    };
    return {
      id: ticketIdFor(order.id, i),
      orderId: order.id,
      editionId: order.editionId,
      ticketTypeId,
      attendee,
      version: 1,
      status: "valid",
      createdAt: charge.approvedAt,
      transferredAt: null,
    };
  });
  return { order: paid, tickets };
}

/** Copia los datos del comprador y la cédula o RUC del borrador a la orden (sin cambiar su estado). */
export function applyDraftToOrder(order: Order, draft: CheckoutDraft): Order {
  const tax = validateTaxId(draft.taxId);
  const buyer: Buyer = {
    name: draft.buyer.name.trim(),
    email: draft.buyer.email.trim().toLowerCase(),
    ...(draft.buyer.phone.trim() ? { phone: draft.buyer.phone.trim() } : {}),
  };
  return {
    ...order,
    buyer,
    taxId: { kind: tax.valid ? tax.kind : "cedula", number: draft.taxId.trim() },
  };
}

/* ───────────── Presentación de montos ───────────── */

/** Texto del cupón aplicado en el resumen: "−10 %" o "−$5" ("−$XX" si el total es de ejemplo). */
export function couponDiscountLabel(coupon: Pick<Coupon, "kind" | "value">, isExample: boolean, money: (cents: number) => string): string {
  if (coupon.kind === "percent") return `−${coupon.value} %`;
  return isExample ? "−$XX" : `−${money(coupon.value)}`;
}
