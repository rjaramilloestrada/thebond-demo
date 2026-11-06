/**
 * Interfaces de los adapters (brief 5.1). Son las mismas que usará el producto
 * real: pasar a producción = cambiar la implementación en `adapters/index.ts`,
 * no reescribir pantallas.
 *
 * No se nombra ninguna pasarela: en la interfaz es la "caja de pagos".
 */
import type {
  AttendeeField,
  Coupon,
  CheckIn,
  Edition,
  EmailLog,
  EmailTemplate,
  ID,
  Invoice,
  Order,
  TaxIdKind,
  Ticket,
  TicketRef,
  TicketType,
  TransferInfo,
  WaitlistEntry,
  Brand,
} from "@/domain/types";

/* ───────── Pagos ("caja de pagos") ───────── */

export type ChargeResult =
  | { ok: true; chargeId: string; approvedAt: string }
  | { ok: false; code: "declined" | "error"; message: string };

export type RefundResult =
  | { ok: true; refundId: string; refundedAt: string }
  | { ok: false; code: "error"; message: string };

export interface PaymentAdapter {
  createCharge(order: Order): Promise<ChargeResult>;
  refund(orderId: ID): Promise<RefundResult>;
}

/* ───────── Correo ───────── */

export interface EmailData {
  orderId?: ID;
  ticketId?: ID;
  /** Nombre de quien recibe el correo (saludo) */
  toName?: string;
  /** Entradas incluidas, con la versión del QR enviada */
  ticketRefs?: TicketRef[];
  waitlistEntryId?: ID;
  transfer?: TransferInfo;
}

export interface EmailAdapter {
  send(template: EmailTemplate, to: string, data: EmailData): Promise<void>;
}

/* ───────── Facturación electrónica (SRI) ───────── */

export type InvoiceResult =
  | { ok: true; invoice: Invoice }
  | { ok: false; message: string };

export interface InvoiceAdapter {
  issue(order: Order, buyerTaxId: { kind: TaxIdKind; number: string }): Promise<InvoiceResult>;
}

/* ───────── Almacenamiento ───────── */

export interface Repository<T extends { id: ID }> {
  list(): Promise<T[]>;
  get(id: ID): Promise<T | undefined>;
  /** Crea o reemplaza */
  save(item: T): Promise<T>;
  remove(id: ID): Promise<void>;
}

export interface EditionRepository extends Repository<Edition> {
  getBySlug(slug: string): Promise<Edition | undefined>;
}

export interface CouponRepository extends Repository<Coupon> {
  findByCode(code: string): Promise<Coupon | undefined>;
}

/** CRUD de editions, ticketTypes, orders, tickets, coupons, waitlist (+ soporte del modelo) */
export interface StorageAdapter {
  editions: EditionRepository;
  brands: Repository<Brand>;
  ticketTypes: Repository<TicketType>;
  orders: Repository<Order>;
  tickets: Repository<Ticket>;
  coupons: CouponRepository;
  waitlist: Repository<WaitlistEntry>;
  attendeeFields: Repository<AttendeeField>;
  checkIns: Repository<CheckIn>;
  invoices: Repository<Invoice>;
  emails: Repository<EmailLog>;
  /** "Reiniciar demo": restaura los datos semilla */
  reset(): Promise<void>;
}
