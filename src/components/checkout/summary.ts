import { couponDiscountLabel } from "@/domain/checkout";
import { computeTotals, formatMoney } from "@/domain/pricing";
import type { Coupon, OrderLine, TicketType } from "@/domain/types";

export interface SummaryRow {
  id: string;
  label: string;
  detail: string;
  amount: string;
}

export interface SummaryData {
  rows: SummaryRow[];
  quantity: number;
  subtotal: string;
  coupon: { code: string; text: string } | null;
  total: string;
  /** Los montos son de ejemplo ($XX en pantalla) */
  isExample: boolean;
  totalCents: number;
}

/**
 * Datos del resumen (selector, datos y pago). Si algún precio es de ejemplo se
 * ve "$XX": nunca aparece una cifra inventada, aunque por dentro se calcule con
 * los centavos de ejemplo.
 */
export function buildSummary(params: {
  lines: readonly OrderLine[];
  ticketTypes: readonly TicketType[];
  coupon: Pick<Coupon, "code" | "kind" | "value"> | null;
  discountCents: number;
  stageLabels?: Record<string, string>;
}): SummaryData {
  const { lines, ticketTypes, coupon, discountCents } = params;
  const totals = computeTotals([...lines], discountCents);
  const money = (cents: number, example = totals.isExample) => formatMoney(cents, { isExample: example });
  const typeName = (id: string) => ticketTypes.find((t) => t.id === id);
  return {
    rows: lines.map((l) => {
      const tt = typeName(l.ticketTypeId);
      const stage = tt?.stages.find((s) => s.key === l.stageKey);
      return {
        id: `${l.ticketTypeId}-${l.stageKey}`,
        label: `${tt?.name ?? "Entrada"} × ${l.quantity}`,
        detail: stage ? `Etapa ${stage.label}` : "",
        amount: money(l.unitCents * l.quantity, l.isExample),
      };
    }),
    quantity: totals.quantity,
    subtotal: money(totals.subtotalCents),
    coupon: coupon
      ? { code: coupon.code, text: couponDiscountLabel(coupon, totals.isExample, (c) => formatMoney(c)) }
      : null,
    total: money(totals.totalCents),
    isExample: totals.isExample,
    totalCents: totals.totalCents,
  };
}
