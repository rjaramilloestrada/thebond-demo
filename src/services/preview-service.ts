/**
 * Vistas previas de los documentos del post compra (brief 6.3): arma los datos
 * del correo (`/correo?id=`) y de la factura RIDE (`/factura?id=`) a partir de
 * lo guardado. Lee todo por `@/adapters`; no escribe nada. En producción el
 * mismo armado alimentaría el envío real (Resend) y la factura del SRI.
 */
import QRCode from "qrcode";
import { storage } from "@/adapters";
import { createTicketToken } from "@/domain/ticket-token";
import type { Edition, EmailLog, Invoice, Order, OrderLine, Ticket, TicketRef, TicketType } from "@/domain/types";
import type { EmailModel } from "@/emails/render";
import { color } from "@/emails/theme";
import type { EmailBase, EmailEdition, EmailTicket } from "@/emails/types";
import { editionHref, entryHref, withTrailingSlash } from "@/lib/routes";

/* ───────────── Correos ───────────── */

export type EmailPreview =
  | { ok: true; log: EmailLog; model: EmailModel }
  | { ok: false; message: string };

function emailEdition(edition: Edition, siteUrl: string): EmailEdition {
  return {
    url: `${siteUrl}${withTrailingSlash(editionHref(edition.slug))}`,
    number: edition.number,
    title: edition.title,
    dateLabel: edition.dateLabel,
    venueName: edition.venueName,
    venueAddress: edition.venueAddress,
    schedule: edition.schedule,
    includes: edition.includes,
  };
}

/** QR del token como imagen PNG (data URL), con los colores de marca del tema de correo. */
function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
    color: { dark: color.night, light: color.cream },
  });
}

/**
 * Entradas que incluye un correo, tal como se enviaron: la versión del QR sale
 * de `ticketRefs` (así un correo viejo conserva su QR aunque la entrada se haya
 * transferido). Los correos semilla no traen referencias: se usan las entradas
 * de la orden en su versión actual.
 */
async function emailTickets(log: EmailLog, siteUrl: string): Promise<{ tickets: EmailTicket[]; rows: Ticket[] }> {
  let refs: TicketRef[] | undefined = log.ticketRefs?.length ? log.ticketRefs : undefined;
  if (!refs) {
    const all = await storage.tickets.list();
    const mine = log.ticketId ? all.filter((t) => t.id === log.ticketId) : all.filter((t) => t.orderId === log.orderId);
    refs = mine.sort((a, b) => a.id.localeCompare(b.id)).map((t) => ({ ticketId: t.id, version: t.version }));
  }
  const types = await storage.ticketTypes.list();
  const rows: Ticket[] = [];
  const found: { ticket: Ticket; ref: TicketRef }[] = [];
  for (const ref of refs) {
    const ticket = await storage.tickets.get(ref.ticketId);
    if (ticket) found.push({ ticket, ref });
  }
  const tickets: EmailTicket[] = [];
  for (const [i, { ticket, ref }] of found.entries()) {
    const token = await createTicketToken(ticket.id, ref.version);
    rows.push(ticket);
    tickets.push({
      index: i + 1,
      total: found.length,
      attendeeName: ref.attendeeName ?? ticket.attendee.name,
      ticketTypeName: types.find((t: TicketType) => t.id === ticket.ticketTypeId)?.name ?? "Entrada",
      qrDataUrl: await qrDataUrl(token),
      url: `${siteUrl}${withTrailingSlash(entryHref(token))}`,
      code: ref.version > 1 ? `${ticket.id.toUpperCase()} · QR ${ref.version}` : ticket.id.toUpperCase(),
    });
  }
  return { tickets, rows };
}

/**
 * Arma el modelo de un correo registrado. `siteUrl` es el origen del sitio con
 * su subruta (en el navegador, `location.origin` + basePath): de ahí salen los
 * enlaces y las imágenes de marca (`/email/*.png`).
 */
export async function loadEmailPreview(emailId: string, siteUrl: string): Promise<EmailPreview> {
  const log = await storage.emails.get(emailId);
  if (!log) return { ok: false, message: "No encontramos este correo. Solo existen los que se generaron en este navegador." };

  const order = log.orderId ? await storage.orders.get(log.orderId) : undefined;
  const entry = log.waitlistEntryId ? await storage.waitlist.get(log.waitlistEntryId) : undefined;
  const recipientName = log.toName ?? (order && order.buyer.email.toLowerCase() === log.to.toLowerCase() ? order.buyer.name : log.to);

  const withEdition = async (editionId: string | undefined) => {
    const edition = editionId ? await storage.editions.get(editionId) : undefined;
    return edition ? emailEdition(edition, siteUrl) : undefined;
  };
  const missing = (what: string): EmailPreview => ({ ok: false, message: `Este correo ya no se puede mostrar: falta ${what}.` });
  const base = (edition: EmailEdition): EmailBase => ({ edition, assetBase: siteUrl, recipientName });

  switch (log.template) {
    case "ticket": {
      const { tickets, rows } = await emailTickets(log, siteUrl);
      const edition = await withEdition(order?.editionId ?? rows[0]?.editionId);
      if (!edition) return missing("la edición");
      if (!tickets.length) return missing("la entrada");
      return { ok: true, log, model: { template: "ticket", props: { ...base(edition), tickets } } };
    }
    case "reminder": {
      const { tickets, rows } = await emailTickets(log, siteUrl);
      const edition = await withEdition(rows[0]?.editionId ?? order?.editionId);
      if (!edition) return missing("la edición");
      if (!tickets[0]) return missing("la entrada");
      return { ok: true, log, model: { template: "reminder", props: { ...base(edition), ticket: { ...tickets[0], total: 1 } } } };
    }
    case "waitlist-available": {
      const edition = await withEdition(entry?.editionId);
      if (!edition) return missing("la edición o la persona de la lista de espera");
      return { ok: true, log, model: { template: "waitlist-available", props: base(edition) } };
    }
    case "transfer": {
      if (!log.transfer) return missing("los datos de la transferencia");
      const { tickets, rows } = await emailTickets(log, siteUrl);
      const edition = await withEdition(rows[0]?.editionId ?? order?.editionId);
      if (!edition) return missing("la edición");
      const ticket = log.transfer.role === "new-holder" && tickets[0] ? { ...tickets[0], total: 1 } : undefined;
      return { ok: true, log, model: { template: "transfer", props: { ...base(edition), transfer: log.transfer, ticket } } };
    }
    default:
      return { ok: false, message: "Esta plantilla de correo todavía no tiene vista previa." };
  }
}

/* ───────────── Factura (RIDE) ───────────── */

export interface InvoiceLineView {
  description: string;
  detail: string;
  quantity: number;
  unitCents: number;
  totalCents: number;
  isExample: boolean;
}

export type InvoicePreview =
  | {
      ok: true;
      invoice: Invoice;
      order: Order;
      edition: Edition | undefined;
      taxKind: Order["taxId"]["kind"];
      lines: InvoiceLineView[];
    }
  | { ok: false; message: string };

function lineView(line: OrderLine, types: TicketType[], edition: Edition | undefined): InvoiceLineView {
  const type = types.find((t) => t.id === line.ticketTypeId);
  const stage = type?.stages.find((s) => s.key === line.stageKey);
  return {
    description: type?.name ?? "Entrada",
    detail: [edition ? `THE BOND · Edición ${edition.number} · ${edition.title}` : "THE BOND", stage?.label].filter(Boolean).join(" · "),
    quantity: line.quantity,
    unitCents: line.unitCents,
    totalCents: line.unitCents * line.quantity,
    isExample: line.isExample,
  };
}

/** Datos de la factura y de su orden para dibujar el RIDE. */
export async function loadInvoicePreview(invoiceId: string): Promise<InvoicePreview> {
  const invoice = await storage.invoices.get(invoiceId);
  if (!invoice) return { ok: false, message: "No encontramos esta factura. Solo existen las que se generaron en este navegador." };
  const order = await storage.orders.get(invoice.orderId);
  if (!order) return { ok: false, message: "No encontramos la orden de esta factura." };
  const [edition, types] = await Promise.all([storage.editions.get(order.editionId), storage.ticketTypes.list()]);
  return {
    ok: true,
    invoice,
    order,
    edition,
    taxKind: order.taxId.kind,
    lines: order.lines.map((l) => lineView(l, types, edition)),
  };
}
