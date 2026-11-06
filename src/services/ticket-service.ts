/**
 * Servicio de entradas emitidas (post compra, brief 6.3): resolver un token QR
 * contra el estado guardado, transferir una entrada y preparar el recordatorio.
 * Todo pasa por `@/adapters`; las pantallas no escriben datos de negocio.
 */
import { emails, storage } from "@/adapters";
import { classifyToken, applyTransfer, checkTransfer, type TokenState, type TransferErrors, type TransferTarget } from "@/domain/tickets";
import { createTicketToken, verifyTicketToken } from "@/domain/ticket-token";
import type { EmailLog, ID, Ticket } from "@/domain/types";

/* ───────────── Token → entrada ───────────── */

export interface TokenResolution {
  state: TokenState;
  ticket?: Ticket;
}

/**
 * Verifica la firma del token (`verifyTicketToken`) Y lo compara con lo
 * guardado: la entrada existe, está vigente y la versión coincide.
 */
export async function resolveToken(token: string): Promise<TokenResolution> {
  const parsed = await verifyTicketToken(token);
  const ticket = parsed ? await storage.tickets.get(parsed.ticketId) : undefined;
  const state = classifyToken(parsed, ticket);
  return state === "unknown" ? { state } : { state, ticket };
}

/* ───────────── Transferencia ───────────── */

export type TransferResult =
  | {
      ok: true;
      ticket: Ticket;
      /** Token del QR nuevo (la versión anterior ya no sirve) */
      token: string;
      /** Correos a la nueva titular y a la anterior: se registran en segundo plano; nunca rechaza */
      followUps: Promise<void>;
    }
  | {
      ok: false;
      code: "not_found" | "stale" | "invalid" | "same_holder" | "not_valid" | "checked_in" | "past";
      message: string;
      errors?: TransferErrors;
    };

/**
 * Transfiere una entrada: `version` + 1 (el QR anterior se invalida), la
 * asistente se reemplaza, se marca `transferredAt` y se registran dos correos
 * `transfer` (a quien la recibe y a quien la tenía). `expectedVersion` es la del
 * QR desde el que se hace la transferencia: evita transferir dos veces con el
 * mismo enlace.
 */
export async function transferTicket(ticketId: ID, expectedVersion: number, to: TransferTarget): Promise<TransferResult> {
  const ticket = await storage.tickets.get(ticketId);
  if (!ticket) return { ok: false, code: "not_found", message: "No encontramos esta entrada." };
  if (ticket.version !== expectedVersion) {
    return { ok: false, code: "stale", message: "Esta entrada ya cambió de titular. Abre el QR más reciente." };
  }

  const [edition, checkIns] = await Promise.all([storage.editions.get(ticket.editionId), storage.checkIns.list()]);
  const check = checkTransfer({ ticket, edition, checkIns, to });
  if (!check.ok) return check;

  const updated = applyTransfer(ticket, check.target);
  await storage.tickets.save(updated);
  const token = await createTicketToken(updated.id, updated.version);

  const previous = ticket.attendee;
  const followUps = (async () => {
    try {
      await Promise.all([
        emails.send("transfer", updated.attendee.email, {
          orderId: updated.orderId,
          ticketId: updated.id,
          toName: updated.attendee.name,
          ticketRefs: [{ ticketId: updated.id, version: updated.version, attendeeName: updated.attendee.name }],
          transfer: { role: "new-holder", fromName: previous.name, toName: updated.attendee.name, toEmail: updated.attendee.email },
        }),
        emails.send("transfer", previous.email, {
          orderId: updated.orderId,
          ticketId: updated.id,
          toName: previous.name,
          ticketRefs: [{ ticketId: updated.id, version: ticket.version, attendeeName: previous.name }],
          transfer: { role: "previous-holder", fromName: previous.name, toName: updated.attendee.name, toEmail: updated.attendee.email },
        }),
      ]);
    } catch {
      // Son registros de demo: un fallo aquí no debe deshacer la transferencia
    }
  })();

  return { ok: true, ticket: updated, token, followUps };
}

/* ───────────── Recordatorio ───────────── */

/**
 * Devuelve el correo de recordatorio de una entrada (versión vigente),
 * creándolo si aún no existe. En producción lo enviaría un proceso programado
 * la víspera; en el demo se genera al pedir la vista previa.
 */
const remindersInFlight = new Map<ID, Promise<EmailLog | undefined>>();

export function ensureReminder(ticketId: ID): Promise<EmailLog | undefined> {
  const running = remindersInFlight.get(ticketId);
  if (running) return running;
  const task = createReminder(ticketId).finally(() => remindersInFlight.delete(ticketId));
  remindersInFlight.set(ticketId, task);
  return task;
}

async function createReminder(ticketId: ID): Promise<EmailLog | undefined> {
  const ticket = await storage.tickets.get(ticketId);
  if (!ticket || ticket.status !== "valid") return undefined;
  const find = async () =>
    (await storage.emails.list())
      .filter(
        (e) =>
          e.template === "reminder" &&
          e.ticketId === ticketId &&
          e.to === ticket.attendee.email &&
          e.ticketRefs?.[0]?.version === ticket.version,
      )
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];

  const existing = await find();
  if (existing) return existing;
  await emails.send("reminder", ticket.attendee.email, {
    orderId: ticket.orderId,
    ticketId: ticket.id,
    toName: ticket.attendee.name,
    ticketRefs: [{ ticketId: ticket.id, version: ticket.version, attendeeName: ticket.attendee.name }],
  });
  return find();
}
