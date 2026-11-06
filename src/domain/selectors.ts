/**
 * Selectores puros de lectura (sin React ni store) para el sitio público.
 * Los usan los server components con los datos semilla y las islas cliente con
 * el estado persistido, así que ambos caminos calculan igual.
 */
import { getStageStatuses, type StageInfo } from "./pricing";
import type { Brand, Edition, ID, Order, PriceStage, TicketType } from "./types";

type Table<T> = Record<ID, T> | readonly T[];

function rows<T>(table: Table<T>): T[] {
  return Array.isArray(table) ? [...(table as readonly T[])] : Object.values(table as Record<ID, T>);
}

/** ¿La orden retiene cupos? Pagadas y reservas vigentes; no canceladas, reembolsadas ni vencidas. */
export function holdsSeats(order: Order, now: Date = new Date()): boolean {
  if (order.status === "paid") return true;
  if (order.status === "reserved") {
    return order.reservationExpiresAt !== null && new Date(order.reservationExpiresAt).getTime() > now.getTime();
  }
  return false;
}

/** Entradas vendidas (o reservadas) de una edición, opcionalmente de un solo tipo. */
export function soldCount(
  orders: Table<Order>,
  editionId: ID,
  opts: { ticketTypeId?: ID; now?: Date } = {},
): number {
  const now = opts.now ?? new Date();
  let total = 0;
  for (const order of rows(orders)) {
    if (order.editionId !== editionId || !holdsSeats(order, now)) continue;
    for (const line of order.lines) {
      if (opts.ticketTypeId && line.ticketTypeId !== opts.ticketTypeId) continue;
      total += line.quantity;
    }
  }
  return total;
}

/** Cupos restantes. `null` si el aforo es pendiente. */
export function remainingSeats(
  edition: Pick<Edition, "id" | "capacity">,
  orders: Table<Order>,
  now?: Date,
): number | null {
  if (edition.capacity === null) return null;
  return Math.max(0, edition.capacity - soldCount(orders, edition.id, { now }));
}

/**
 * ¿Edición agotada? Sí cuando la edición está marcada `soldOut`, cuando el
 * interruptor de demo `forceSoldOut` está activo o cuando no quedan cupos.
 */
export function isSoldOut(
  edition: Pick<Edition, "id" | "capacity" | "soldOut">,
  orders: Table<Order>,
  flags: { forceSoldOut?: boolean } = {},
  now?: Date,
): boolean {
  if (edition.soldOut || flags.forceSoldOut) return true;
  const remaining = remainingSeats(edition, orders, now);
  return remaining !== null && remaining === 0;
}

function startsAtMs(edition: Edition): number {
  return edition.startsAt ? new Date(edition.startsAt).getTime() : Number.POSITIVE_INFINITY;
}

/** Próxima edición: publicada y no pasada; la de fecha más cercana (sin fecha, al final), luego por número. */
export function nextEdition(editions: Table<Edition>): Edition | undefined {
  return rows(editions)
    .filter((e) => e.status === "published" && !e.isPast)
    .sort((a, b) => startsAtMs(a) - startsAtMs(b) || a.number.localeCompare(b.number))[0];
}

/** Ediciones pasadas y publicadas, de la más reciente a la más antigua. */
export function pastEditions(editions: Table<Edition>): Edition[] {
  return rows(editions)
    .filter((e) => e.status === "published" && e.isPast)
    .sort((a, b) => b.number.localeCompare(a.number));
}

/** Ediciones publicadas visibles en el sitio (próxima primero, luego las pasadas). */
export function publishedEditions(editions: Table<Edition>): Edition[] {
  const next = nextEdition(editions);
  return [...(next ? [next] : []), ...pastEditions(editions)];
}

/* ───────────── Entradas y etapas ───────────── */

export interface TicketTypeView {
  ticketType: TicketType;
  sold: number;
  stages: StageInfo[];
  activeStage: PriceStage | null;
  /** Todas las etapas agotadas o vencidas */
  soldOut: boolean;
}

export function ticketTypesOf(ticketTypes: Table<TicketType>, editionId: ID): TicketType[] {
  return rows(ticketTypes)
    .filter((t) => t.editionId === editionId)
    .sort((a, b) => a.order - b.order);
}

export function ticketTypeViews(
  ticketTypes: Table<TicketType>,
  orders: Table<Order>,
  editionId: ID,
  now: Date = new Date(),
): TicketTypeView[] {
  return ticketTypesOf(ticketTypes, editionId).map((ticketType) => {
    const sold = soldCount(orders, editionId, { ticketTypeId: ticketType.id, now });
    const stages = getStageStatuses(ticketType.stages, sold, now);
    const activeStage = stages.find((s) => s.status === "active")?.stage ?? null;
    return { ticketType, sold, stages, activeStage, soldOut: activeStage === null };
  });
}

/** Precio "desde": el menor entre las etapas activas de cada tipo. `null` si no hay ninguna activa. */
export function lowestActivePrice(views: TicketTypeView[]): { amountCents: number; isExample: boolean } | null {
  const active = views.map((v) => v.activeStage).filter((s): s is PriceStage => s !== null);
  if (active.length === 0) return null;
  return active.reduce((min, s) => (s.amountCents < min.amountCents ? s : min));
}

/* ───────────── Modelo de vista de una edición ───────────── */

export interface EditionSource {
  editions: Table<Edition>;
  brands: Table<Brand>;
  ticketTypes: Table<TicketType>;
  orders: Table<Order>;
}

export interface EditionViewModel {
  edition: Edition;
  brands: Brand[];
  ticketTypes: TicketType[];
  sold: number;
  remaining: number | null;
  soldOut: boolean;
  /** Precio "desde" con la etapa activa actual */
  fromPrice: { amountCents: number; isExample: boolean } | null;
  /** Vendidas por tipo de entrada, para pintar etapas antes de hidratar */
  soldByType: Record<ID, number>;
}

/** Arma lo que necesita una página de edición. `undefined` si el slug no existe o no está publicada. */
export function buildEditionViewModel(
  source: EditionSource,
  slug: string,
  opts: { forceSoldOut?: boolean; now?: Date } = {},
): EditionViewModel | undefined {
  const now = opts.now ?? new Date();
  const edition = rows(source.editions).find((e) => e.slug === slug && e.status === "published");
  if (!edition) return undefined;
  const brandTable = rows(source.brands);
  const brands = edition.brandIds
    .map((id) => brandTable.find((b) => b.id === id))
    .filter((b): b is Brand => Boolean(b));
  const views = ticketTypeViews(source.ticketTypes, source.orders, edition.id, now);
  return {
    edition,
    brands,
    ticketTypes: views.map((v) => v.ticketType),
    sold: soldCount(source.orders, edition.id, { now }),
    remaining: remainingSeats(edition, source.orders, now),
    soldOut: isSoldOut(edition, source.orders, { forceSoldOut: opts.forceSoldOut }, now),
    fromPrice: lowestActivePrice(views),
    soldByType: Object.fromEntries(views.map((v) => [v.ticketType.id, v.sold])),
  };
}

/** Parte "viva" de una edición: lo que cambia con las ventas y los interruptores de demo. */
export interface EditionLive {
  slug: string;
  capacity: number | null;
  capacityIsExample: boolean;
  sold: number;
  remaining: number | null;
  soldOut: boolean;
  fromPrice: { amountCents: number; isExample: boolean } | null;
  soldByType: Record<ID, number>;
}

export function editionLive(vm: EditionViewModel): EditionLive {
  return {
    slug: vm.edition.slug,
    capacity: vm.edition.capacity,
    capacityIsExample: vm.edition.capacityIsExample,
    sold: vm.sold,
    remaining: vm.remaining,
    soldOut: vm.soldOut,
    fromPrice: vm.fromPrice,
    soldByType: vm.soldByType,
  };
}
