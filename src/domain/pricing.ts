import type { Coupon, ID, OrderLine, PriceStage, StageStatus, TicketType } from "./types";

/* ───────────── Etapas de precio ───────────── */

export interface StageInfo {
  stage: PriceStage;
  status: StageStatus;
}

/**
 * Estado de cada etapa de un tipo de entrada.
 *
 * Reglas:
 * - Las etapas se consumen en orden (Preventa → General → Last call).
 * - Una etapa se agota cuando las ventas acumuladas alcanzan su cuota
 *   (cuota acumulada de esa etapa y las anteriores) o cuando pasa su `endsAt`.
 * - La etapa activa es la primera no agotada; las siguientes están "upcoming".
 * - Una etapa sin cuota (`null`) nunca se agota por ventas.
 */
export function getStageStatuses(
  stages: PriceStage[],
  sold: number,
  now: Date = new Date(),
): StageInfo[] {
  let cumulative = 0;
  let activeFound = false;
  return stages.map((stage) => {
    const soldOut = stage.quota !== null && sold >= cumulative + stage.quota;
    if (stage.quota !== null) cumulative += stage.quota;
    const expired = stage.endsAt !== null && now.getTime() >= new Date(stage.endsAt).getTime();
    let status: StageStatus;
    if (activeFound) {
      status = "upcoming";
    } else if (soldOut || expired) {
      status = "past";
    } else {
      status = "active";
      activeFound = true;
    }
    return { stage, status };
  });
}

/** Etapa activa o `null` si todas están agotadas. */
export function getActiveStage(
  ticketType: Pick<TicketType, "stages">,
  sold: number,
  now: Date = new Date(),
): PriceStage | null {
  return getStageStatuses(ticketType.stages, sold, now).find((s) => s.status === "active")?.stage ?? null;
}

/** Etapa siguiente a la activa (para mostrarla tachada o "próximamente"). */
export function getNextStage(
  ticketType: Pick<TicketType, "stages">,
  sold: number,
  now: Date = new Date(),
): PriceStage | null {
  return getStageStatuses(ticketType.stages, sold, now).find((s) => s.status === "upcoming")?.stage ?? null;
}

/* ───────────── Dinero ───────────── */

/** Formato de dinero. Los montos de ejemplo siempre se muestran como "$XX". */
export function formatMoney(cents: number, opts: { isExample?: boolean } = {}): string {
  if (opts.isExample) return "$XX";
  const value = cents / 100;
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/* ───────────── Cupones ───────────── */

export type CouponFailure =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "wrong_edition"
  | "empty";

export type CouponResult =
  | { ok: true; coupon: Coupon; discountCents: number }
  | { ok: false; reason: CouponFailure; message: string };

const COUPON_MESSAGES: Record<CouponFailure, string> = {
  empty: "Escribe un código de cupón.",
  not_found: "Ese cupón no existe. Revisa el código e intenta de nuevo.",
  inactive: "Este cupón ya no está activo.",
  not_started: "Este cupón todavía no está vigente.",
  expired: "Este cupón ya venció.",
  exhausted: "Este cupón alcanzó su límite de usos.",
  wrong_edition: "Este cupón no aplica para esta edición.",
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findCoupon(code: string, coupons: Coupon[]): Coupon | null {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return coupons.find((c) => c.code.toUpperCase() === normalized) ?? null;
}

/** Descuento que aplica un cupón sobre un subtotal (nunca supera el subtotal). */
export function couponDiscountCents(coupon: Coupon, subtotalCents: number): number {
  const raw =
    coupon.kind === "percent" ? Math.round((subtotalCents * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotalCents));
}

/** Valida un código contra la lista de cupones y calcula el descuento. */
export function applyCoupon(params: {
  code: string;
  coupons: Coupon[];
  subtotalCents: number;
  editionId?: ID;
  now?: Date;
}): CouponResult {
  const { code, coupons, subtotalCents, editionId, now = new Date() } = params;
  const fail = (reason: CouponFailure): CouponResult => ({
    ok: false,
    reason,
    message: COUPON_MESSAGES[reason],
  });

  if (!normalizeCouponCode(code)) return fail("empty");
  const coupon = findCoupon(code, coupons);
  if (!coupon) return fail("not_found");
  if (!coupon.active) return fail("inactive");
  if (coupon.editionId && editionId && coupon.editionId !== editionId) return fail("wrong_edition");
  if (coupon.validFrom && now.getTime() < new Date(coupon.validFrom).getTime()) return fail("not_started");
  if (coupon.validUntil && now.getTime() > new Date(coupon.validUntil).getTime()) return fail("expired");
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return fail("exhausted");

  return { ok: true, coupon, discountCents: couponDiscountCents(coupon, subtotalCents) };
}

/* ───────────── Totales ───────────── */

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  quantity: number;
  /** true si algún monto proviene de un precio de ejemplo ($XX en pantalla) */
  isExample: boolean;
}

export function computeTotals(lines: OrderLine[], discountCents = 0): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
  const discount = Math.max(0, Math.min(discountCents, subtotalCents));
  return {
    subtotalCents,
    discountCents: discount,
    totalCents: subtotalCents - discount,
    quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
    isExample: lines.some((l) => l.isExample),
  };
}
