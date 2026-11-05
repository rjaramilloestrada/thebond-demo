/**
 * Datos semilla del demo (brief sección 7).
 *
 * Solo datos reales públicos del Instagram o placeholders `[[PENDIENTE: ...]]`.
 * - Compradores y asistentes: nombres claramente ficticios ("Asistente 01").
 * - Montos: de ejemplo (`isExample: true`); en pantalla siempre "$XX".
 * - Ed. 002: aforo de ejemplo 60, rotulado "ejemplo".
 * - Las órdenes semilla son datos de demostración (`isSeed: true`), no ventas reales.
 */
import { pending } from "@/lib/pending";
import { cedulaCheckDigit } from "@/domain/validation";
import type {
  AttendeeField,
  Brand,
  CheckIn,
  Coupon,
  Edition,
  EmailLog,
  Entities,
  EntityKey,
  ID,
  Invoice,
  Order,
  PriceStage,
  Ticket,
  TicketType,
  WaitlistEntry,
} from "@/domain/types";

export type SeedData = { [K in EntityKey]: Record<ID, Entities[K]> };

export const SEED_VERSION = 1;

const DAY = 86_400_000;
const HOUR = 3_600_000;

function byId<T extends { id: ID }>(items: T[]): Record<ID, T> {
  return Object.fromEntries(items.map((i) => [i.id, i]));
}

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

/** Cédula sintética con patrón evidente (provincia 09 + ceros) y verificador válido. */
function syntheticCedula(n: number): string {
  const first9 = `09${"0".repeat(6)}${n}`.slice(0, 9);
  return `${first9}${cedulaCheckDigit(first9)}`;
}

/** ISO con zona de Ecuador (UTC-5) a partir de un instante. */
function iso(ms: number): string {
  return new Date(ms).toISOString();
}

export function seed(now: Date = new Date()): SeedData {
  const nowMs = now.getTime();

  /* ───────── Marcas aliadas (placeholders) ───────── */
  const brands: Brand[] = [
    {
      id: "br-fit101",
      name: "FIT101",
      handle: pending("@usuario de FIT101"),
      logoAsset: "logo-marca-fit101",
    },
    ...[1, 2, 3].map(
      (n): Brand => ({
        id: `br-pend-${pad(n)}`,
        name: pending(`marca aliada ${n}`),
        handle: pending(`@usuario de la marca aliada ${n}`),
        logoAsset: `logo-marca-${pad(n)}`,
      }),
    ),
  ];

  /* ───────── Ediciones ───────── */
  const includes = [
    {
      id: "inc-experiencias",
      title: "Experiencias",
      description: "Welcome drink, fuel stop, clases y wellness talk.",
    },
    {
      id: "inc-bag",
      title: "THE BOND BAG",
      description: "Un gift bag con productos de las marcas aliadas.",
    },
    {
      id: "inc-table",
      title: "THE BOND TABLE",
      description: "Brunch para compartir con la comunidad.",
    },
    {
      id: "inc-lucky",
      title: "THE LUCKY BOND",
      description: "Sorteo de beneficios entre las asistentes.",
    },
  ];

  const ed001: Edition = {
    id: "ed-001",
    slug: "the-first-experience",
    number: "001",
    title: "The First Experience",
    tagline: "All spots taken. The first of many. Stay close.",
    isPast: true,
    status: "published",
    soldOut: true,
    startsAt: "2026-10-25T10:00:00-05:00",
    dateLabel: "25 OCT 2026",
    venueName: "ONNA",
    venueAddress: `Murano Plaza, Guayaquil · ${pending("dirección exacta de ONNA")}`,
    capacity: null,
    capacityIsExample: false,
    schedule: [
      { time: "10:00", title: "Check-in & Welcome Drink" },
      { time: "10:15", title: "Move I: Mat Pilates" },
      { time: "10:55", title: "The Wellness Talk" },
      { time: "11:15", title: "Move II: Yoga Soft Flow" },
      { time: "11:45", title: "The Bond Table (brunch)" },
    ],
    includes,
    brandIds: ["br-pend-01", "br-pend-02", "br-pend-03"],
    speakers: [],
    faq: [],
    galleryAssets: [1, 2, 3, 4, 5, 6].map((n) => `galeria-001-${pad(n)}`),
    heroAsset: "galeria-001-01",
  };

  const ed002: Edition = {
    id: "ed-002",
    slug: "the-power-hour",
    number: "002",
    title: "The Power Hour",
    tagline: "THE LAST CALL",
    isPast: false,
    status: "published",
    soldOut: false,
    startsAt: null,
    dateLabel: pending("fecha de la ed. 002"),
    venueName: pending("sede de la ed. 002"),
    venueAddress: pending("dirección de la sede de la ed. 002"),
    capacity: 60,
    capacityIsExample: true,
    schedule: [{ time: pending("hora"), title: pending("cronograma de la ed. 002") }],
    includes,
    brandIds: ["br-fit101", "br-pend-01", "br-pend-02"],
    speakers: [1, 2, 3].map((n) => ({
      id: `sp-${pad(n)}`,
      name: pending(`nombre del speaker o coach ${n}`),
      role: pending(`rol del speaker o coach ${n}`),
      photoAsset: `speaker-${pad(n)}`,
    })),
    faq: [
      {
        id: "faq-reembolsos",
        question: "¿Puedo pedir un reembolso?",
        answer: pending("política de reembolsos"),
      },
      {
        id: "faq-privacidad",
        question: "¿Cómo se usan mis datos?",
        answer: pending("política de privacidad"),
      },
      {
        id: "faq-terminos",
        question: "¿Cuáles son los términos y condiciones?",
        answer: pending("términos y condiciones"),
      },
    ],
    galleryAssets: [],
    heroAsset: "hero-edicion",
  };

  /* ───────── Tipos de entrada y etapas ───────── */
  const stages = (base: number, quotas: [number, number, number]): PriceStage[] => [
    { key: "preventa", label: "Preventa", amountCents: base, isExample: true, quota: quotas[0], endsAt: null },
    { key: "general", label: "General", amountCents: base + 500, isExample: true, quota: quotas[1], endsAt: null },
    { key: "last-call", label: "Last call", amountCents: base + 1000, isExample: true, quota: quotas[2], endsAt: null },
  ];

  const ticketTypes: TicketType[] = [
    {
      id: "tt-001-a",
      editionId: "ed-001",
      name: pending("tipos de entrada de la ed. 001"),
      description: pending("descripción del tipo de entrada"),
      order: 1,
      capacity: null,
      maxPerOrder: 4,
      stages: [
        { key: "general", label: "General", amountCents: 1500, isExample: true, quota: null, endsAt: null },
      ],
    },
    {
      id: "tt-002-a",
      editionId: "ed-002",
      name: "Entrada A · ejemplo",
      description: pending("descripción del tipo de entrada A"),
      order: 1,
      capacity: 40,
      maxPerOrder: 4,
      stages: stages(1000, [10, 20, 10]),
    },
    {
      id: "tt-002-b",
      editionId: "ed-002",
      name: "Entrada B · ejemplo",
      description: pending("descripción del tipo de entrada B"),
      order: 2,
      capacity: 20,
      maxPerOrder: 4,
      stages: stages(2000, [5, 10, 5]),
    },
  ];

  /* ───────── Campos por asistente (ed. 002, ejemplos) ───────── */
  const attendeeFields: AttendeeField[] = [
    {
      id: "af-002-talla",
      editionId: "ed-002",
      key: "talla",
      label: "Talla de camiseta (ejemplo)",
      type: "select",
      options: ["XS", "S", "M", "L", "XL"],
      required: true,
      order: 1,
      isExample: true,
    },
    {
      id: "af-002-nivel",
      editionId: "ed-002",
      key: "nivel",
      label: "Nivel (ejemplo)",
      type: "select",
      options: ["Principiante", "Intermedio", "Avanzado"],
      required: false,
      order: 2,
      isExample: true,
    },
  ];

  /* ───────── Cupones ───────── */
  const coupons: Coupon[] = [
    {
      id: "cp-bond10",
      code: "BOND10",
      kind: "percent",
      value: 10,
      maxUses: null,
      usedCount: 1,
      validFrom: null,
      validUntil: null,
      active: true,
      editionId: null,
    },
  ];

  /* ───────── Órdenes y entradas semilla ───────── */
  const orders: Order[] = [];
  const tickets: Ticket[] = [];
  const checkIns: CheckIn[] = [];
  const invoices: Invoice[] = [];
  const emails: EmailLog[] = [];

  let attendeeCounter = 0;
  let orderCounter = 0;
  let invoiceCounter = 0;

  function addOrder(params: {
    editionId: ID;
    ticketTypeId: ID;
    stageKey: PriceStage["key"];
    unitCents: number;
    quantity: number;
    createdAtMs: number;
    couponCode?: string;
    discountPercent?: number;
    answers?: (n: number) => Record<ID, string>;
    invoiceStatus?: Invoice["status"];
    checkedIn?: number; // cuántas entradas de la orden ingresaron
    checkedAtMs?: number;
  }) {
    orderCounter += 1;
    const n = orderCounter;
    const orderId = `ord-${pad(n)}`;
    const subtotal = params.unitCents * params.quantity;
    const discount = params.discountPercent ? Math.round((subtotal * params.discountPercent) / 100) : 0;
    const buyerName = `Comprador ${pad(n)}`;
    const taxNumber = syntheticCedula(n);

    orders.push({
      id: orderId,
      editionId: params.editionId,
      status: "paid",
      buyer: { name: buyerName, email: `comprador${pad(n)}@ejemplo.com` },
      taxId: { kind: "cedula", number: taxNumber },
      lines: [
        {
          ticketTypeId: params.ticketTypeId,
          stageKey: params.stageKey,
          unitCents: params.unitCents,
          quantity: params.quantity,
          isExample: true,
        },
      ],
      couponCode: params.couponCode ?? null,
      subtotalCents: subtotal,
      discountCents: discount,
      totalCents: subtotal - discount,
      createdAt: iso(params.createdAtMs),
      reservationExpiresAt: null,
      paidAt: iso(params.createdAtMs + 90_000),
      chargeId: `demo_ch_${pad(n, 4)}`,
      isSeed: true,
    });

    for (let q = 0; q < params.quantity; q++) {
      attendeeCounter += 1;
      const a = attendeeCounter;
      const ticketId = `tk-${pad(a, 3)}`;
      tickets.push({
        id: ticketId,
        orderId,
        editionId: params.editionId,
        ticketTypeId: params.ticketTypeId,
        attendee: {
          name: `Asistente ${pad(a)}`,
          email: `asistente${pad(a)}@ejemplo.com`,
          answers: params.answers ? params.answers(a) : {},
        },
        version: 1,
        status: "valid",
        createdAt: iso(params.createdAtMs + 90_000),
        transferredAt: null,
      });
      if (params.checkedIn && q < params.checkedIn) {
        checkIns.push({
          id: `ci-${pad(a, 3)}`,
          ticketId,
          editionId: params.editionId,
          at: iso((params.checkedAtMs ?? params.createdAtMs) + q * 4 * 60_000),
          result: "valid",
        });
      }
    }

    invoiceCounter += 1;
    invoices.push({
      id: `inv-${pad(invoiceCounter)}`,
      orderId,
      number: `DEMO-${pad(invoiceCounter, 6)}`,
      status: params.invoiceStatus ?? "authorized",
      issuedAt: iso(params.createdAtMs + 120_000),
      buyerName,
      buyerTaxId: taxNumber,
      totalCents: subtotal - discount,
      isExample: true,
    });
  }

  // Ed. 001 (pasada, agotada): 4 órdenes de 2 entradas, 6 ingresos reales.
  const ed001Start = new Date(ed001.startsAt as string).getTime();
  const ed001Checkin = ed001Start - 10 * 60_000;
  [
    { daysBefore: 12, checkedIn: 2 },
    { daysBefore: 9, checkedIn: 2 },
    { daysBefore: 6, checkedIn: 1 },
    { daysBefore: 3, checkedIn: 1 },
  ].forEach(({ daysBefore, checkedIn }) =>
    addOrder({
      editionId: "ed-001",
      ticketTypeId: "tt-001-a",
      stageKey: "general",
      unitCents: 1500,
      quantity: 2,
      createdAtMs: ed001Start - daysBefore * DAY,
      checkedIn,
      checkedAtMs: ed001Checkin,
    }),
  );

  // Ed. 002 (en venta): ventas recientes repartidas en los últimos días.
  const talla = (a: number) => ({
    "af-002-talla": ["S", "M", "L", "M", "S", "XL", "M"][a % 7],
    "af-002-nivel": ["Principiante", "Intermedio", "Avanzado"][a % 3],
  });
  addOrder({
    editionId: "ed-002", ticketTypeId: "tt-002-a", stageKey: "preventa", unitCents: 1000, quantity: 2,
    createdAtMs: nowMs - 6 * DAY + 2 * HOUR, answers: talla,
  });
  addOrder({
    editionId: "ed-002", ticketTypeId: "tt-002-b", stageKey: "preventa", unitCents: 2000, quantity: 1,
    createdAtMs: nowMs - 5 * DAY + 5 * HOUR, answers: talla,
  });
  addOrder({
    editionId: "ed-002", ticketTypeId: "tt-002-a", stageKey: "preventa", unitCents: 1000, quantity: 1,
    createdAtMs: nowMs - 3 * DAY + 1 * HOUR, answers: talla, couponCode: "BOND10", discountPercent: 10,
  });
  addOrder({
    editionId: "ed-002", ticketTypeId: "tt-002-b", stageKey: "preventa", unitCents: 2000, quantity: 2,
    createdAtMs: nowMs - 2 * DAY + 4 * HOUR, answers: talla, invoiceStatus: "pending",
  });
  addOrder({
    editionId: "ed-002", ticketTypeId: "tt-002-a", stageKey: "preventa", unitCents: 1000, quantity: 1,
    createdAtMs: nowMs - 1 * DAY + 3 * HOUR, answers: talla,
  });

  // Correos enviados (registro del demo) para las dos últimas órdenes de la ed. 002.
  orders
    .filter((o) => o.editionId === "ed-002")
    .slice(-2)
    .forEach((o, i) => {
      emails.push({
        id: `em-${pad(i + 1)}`,
        template: "ticket",
        to: o.buyer.email,
        subject: "Tu entrada a THE BOND",
        orderId: o.id,
        ticketId: null,
        sentAt: o.paidAt ?? o.createdAt,
      });
    });

  /* ───────── Lista de espera (ed. 001 agotada) ───────── */
  const waitlist: WaitlistEntry[] = [1, 2].map((n) => ({
    id: `wl-${pad(n)}`,
    editionId: "ed-001",
    name: `Lista de espera ${pad(n)}`,
    email: `espera${pad(n)}@ejemplo.com`,
    createdAt: iso(ed001Start - (2 + n) * DAY),
    notifiedAt: null,
  }));

  return {
    editions: byId([ed001, ed002]),
    brands: byId(brands),
    ticketTypes: byId(ticketTypes),
    orders: byId(orders),
    tickets: byId(tickets),
    coupons: byId(coupons),
    waitlist: byId(waitlist),
    attendeeFields: byId(attendeeFields),
    checkIns: byId(checkIns),
    invoices: byId(invoices),
    emails: byId(emails),
  };
}
