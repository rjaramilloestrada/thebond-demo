/**
 * Ventas en vivo simuladas (interruptor `simulateLiveSales` del panel de demo,
 * brief 6.6). Funciones puras: construyen una venta semilla de 1 entrada y el
 * intervalo hasta la siguiente. Quien las llama las persiste vía adapter.
 */
import { cedulaCheckDigit } from "./validation";
import type { TicketTypeView } from "./selectors";
import type { Edition, Order, Ticket } from "./types";

export const LIVE_SALE_MIN_MS = 6_000;
export const LIVE_SALE_MAX_MS = 10_000;

/** Intervalo aleatorio entre ventas: 6 a 10 s. `rand` es inyectable para tests. */
export function nextLiveSaleDelay(rand: () => number = Math.random): number {
  return Math.round(LIVE_SALE_MIN_MS + rand() * (LIVE_SALE_MAX_MS - LIVE_SALE_MIN_MS));
}

/** Tipo de entrada donde cae la venta: el primero con etapa activa (ponderado por azar). */
export function pickSaleTarget(views: TicketTypeView[], rand: () => number = Math.random): TicketTypeView | undefined {
  const open = views.filter((v) => v.activeStage !== null);
  if (open.length === 0) return undefined;
  return open[Math.min(open.length - 1, Math.floor(rand() * open.length))];
}

const pad = (n: number, size = 3) => String(n).padStart(size, "0");

/** Cédula sintética con patrón evidente (provincia 09 + ceros) y verificador válido. */
function syntheticCedula(n: number): string {
  const first9 = `09${"0".repeat(6)}${n % 10}`;
  return `${first9}${cedulaCheckDigit(first9)}`;
}

/** Una venta de 1 entrada, marcada como dato semilla (`isSeed`). `seq` debe ser único por venta. */
export function buildLiveSale(params: {
  edition: Pick<Edition, "id">;
  view: TicketTypeView;
  seq: number;
  now?: Date;
}): { order: Order; ticket: Ticket } | undefined {
  const { edition, view, seq } = params;
  const stage = view.activeStage;
  if (!stage) return undefined;
  const at = (params.now ?? new Date()).toISOString();
  const orderId = `ord-live-${seq}`;
  const order: Order = {
    id: orderId,
    editionId: edition.id,
    status: "paid",
    buyer: { name: `Comprador en vivo ${pad(seq)}`, email: `comprador.vivo${pad(seq)}@ejemplo.com` },
    taxId: { kind: "cedula", number: syntheticCedula(seq) },
    lines: [
      {
        ticketTypeId: view.ticketType.id,
        stageKey: stage.key,
        unitCents: stage.amountCents,
        quantity: 1,
        isExample: stage.isExample,
      },
    ],
    couponCode: null,
    subtotalCents: stage.amountCents,
    discountCents: 0,
    totalCents: stage.amountCents,
    createdAt: at,
    reservationExpiresAt: null,
    paidAt: at,
    chargeId: `demo_ch_live_${seq}`,
    isSeed: true,
  };
  const ticket: Ticket = {
    id: `tk-live-${seq}`,
    orderId,
    editionId: edition.id,
    ticketTypeId: view.ticketType.id,
    attendee: { name: `Asistente en vivo ${pad(seq)}`, email: `asistente.vivo${pad(seq)}@ejemplo.com`, answers: {} },
    version: 1,
    status: "valid",
    createdAt: at,
    transferredAt: null,
  };
  return { order, ticket };
}
