/**
 * Modelo de datos del demo (brief 5.2). Igual al de producción:
 * editions → ticket_types (con etapas de precio) → orders → tickets (token QR firmado)
 * + coupons, waitlist, attendee_fields (campos por edición), check_ins.
 *
 * Reglas:
 * - Dinero en centavos (enteros).
 * - Fechas en ISO 8601. `null` = [[PENDIENTE]] (se muestra con `dateLabel`).
 * - Los textos pueden contener marcadores `[[PENDIENTE: ...]]`.
 */

export type ID = string;
export type ISODate = string;

export type EditionStatus = "draft" | "published";

export interface ScheduleItem {
  /** "10:00" o un marcador pendiente */
  time: string;
  title: string;
}

export interface IncludeItem {
  id: ID;
  title: string;
  description: string;
}

export interface Brand {
  id: ID;
  /** Nombre visible de la marca (o marcador pendiente) */
  name: string;
  /** @usuario de Instagram (o marcador pendiente). Se muestra como texto hasta tener permiso y archivos */
  handle: string;
  /** Asset placeholder, ej. "logo-marca-fit101" */
  logoAsset: string;
}

export interface Speaker {
  id: ID;
  name: string;
  role: string;
  photoAsset: string;
}

export interface FaqItem {
  id: ID;
  question: string;
  answer: string;
}

export interface Edition {
  id: ID;
  slug: string;
  /** "001", "002" */
  number: string;
  title: string;
  tagline: string;
  /** Ed. pasada = fecha ya ocurrida; se usa para archivo */
  isPast: boolean;
  status: EditionStatus;
  /** Forzado a agotado (All spots taken). El demo también puede forzarlo con un interruptor */
  soldOut: boolean;
  startsAt: ISODate | null;
  /** Texto de fecha a mostrar: "25 OCT 2026" o un marcador pendiente */
  dateLabel: string;
  venueName: string;
  venueAddress: string;
  /** Aforo total. `null` = pendiente */
  capacity: number | null;
  capacityIsExample: boolean;
  schedule: ScheduleItem[];
  includes: IncludeItem[];
  brandIds: ID[];
  speakers: Speaker[];
  faq: FaqItem[];
  /** Assets placeholder de galería, en /public/placeholders */
  galleryAssets: string[];
  heroAsset: string;
}

export type StageKey = "preventa" | "general" | "last-call";

export interface PriceStage {
  key: StageKey;
  label: string;
  /** Centavos. Si `isExample`, en pantalla se muestra "$XX" */
  amountCents: number;
  isExample: boolean;
  /** Cuántas entradas de este tipo se venden a este precio. `null` = sin tope */
  quota: number | null;
  /** Fin de la etapa por fecha. `null` = sin fecha (pendiente o no aplica) */
  endsAt: ISODate | null;
}

export interface TicketType {
  id: ID;
  editionId: ID;
  name: string;
  description: string;
  order: number;
  /** Cupos de este tipo. `null` = pendiente */
  capacity: number | null;
  maxPerOrder: number;
  stages: PriceStage[];
}

export type StageStatus = "past" | "active" | "upcoming";

export type OrderStatus = "reserved" | "paid" | "cancelled" | "refunded" | "expired";

export type TaxIdKind = "cedula" | "ruc";

export interface Buyer {
  name: string;
  email: string;
  phone?: string;
}

export interface OrderLine {
  ticketTypeId: ID;
  stageKey: StageKey;
  unitCents: number;
  quantity: number;
  /** Heredado del precio de la etapa */
  isExample: boolean;
}

export interface Order {
  id: ID;
  editionId: ID;
  status: OrderStatus;
  buyer: Buyer;
  taxId: { kind: TaxIdKind; number: string };
  lines: OrderLine[];
  couponCode: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: ISODate;
  /** Solo en estado `reserved` */
  reservationExpiresAt: ISODate | null;
  paidAt: ISODate | null;
  chargeId: string | null;
  /** Dato semilla de demostración */
  isSeed?: boolean;
}

export type TicketStatus = "valid" | "transferred" | "cancelled";

export interface Attendee {
  name: string;
  email: string;
  /** Respuestas a los campos por asistente: fieldId → valor */
  answers: Record<ID, string>;
}

export interface Ticket {
  id: ID;
  orderId: ID;
  editionId: ID;
  ticketTypeId: ID;
  attendee: Attendee;
  /** Sube al transferir: el QR anterior (versión anterior) queda inválido */
  version: number;
  status: TicketStatus;
  createdAt: ISODate;
  transferredAt: ISODate | null;
}

export type CouponKind = "percent" | "amount";

export interface Coupon {
  id: ID;
  code: string;
  kind: CouponKind;
  /** percent: 10 = 10 %. amount: centavos */
  value: number;
  /** `null` = sin límite */
  maxUses: number | null;
  usedCount: number;
  validFrom: ISODate | null;
  validUntil: ISODate | null;
  active: boolean;
  /** `null` = vale para cualquier edición */
  editionId: ID | null;
}

export interface WaitlistEntry {
  id: ID;
  editionId: ID;
  name: string;
  email: string;
  createdAt: ISODate;
  notifiedAt: ISODate | null;
}

export type AttendeeFieldType = "text" | "select";

export interface AttendeeField {
  id: ID;
  editionId: ID;
  key: string;
  label: string;
  type: AttendeeFieldType;
  options: string[];
  required: boolean;
  order: number;
  isExample: boolean;
}

export type CheckInResult = "valid" | "already_used" | "invalid";

export interface CheckIn {
  id: ID;
  ticketId: ID | null;
  editionId: ID;
  at: ISODate;
  result: CheckInResult;
}

export type InvoiceStatus = "authorized" | "pending" | "rejected" | "annulled";

export interface Invoice {
  id: ID;
  orderId: ID;
  /** Numeración ficticia del demo, ej. "DEMO-000001" */
  number: string;
  status: InvoiceStatus;
  issuedAt: ISODate;
  buyerName: string;
  buyerTaxId: string;
  totalCents: number;
  isExample: boolean;
}

export type EmailTemplate =
  | "ticket"
  | "reminder"
  | "waitlist-available"
  | "refund"
  | "transfer";

export interface EmailLog {
  id: ID;
  template: EmailTemplate;
  to: string;
  subject: string;
  orderId: ID | null;
  ticketId: ID | null;
  sentAt: ISODate;
}

/** Entidades persistidas en el store (normalizadas por id) */
export interface Entities {
  editions: Edition;
  brands: Brand;
  ticketTypes: TicketType;
  orders: Order;
  tickets: Ticket;
  coupons: Coupon;
  waitlist: WaitlistEntry;
  attendeeFields: AttendeeField;
  checkIns: CheckIn;
  invoices: Invoice;
  emails: EmailLog;
}

export type EntityKey = keyof Entities;
