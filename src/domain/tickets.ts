/**
 * Reglas puras de las entradas ya emitidas (Fase 4): validez de un token QR
 * contra el estado guardado, y transferencia. Sin React, sin store y sin
 * adapters: `src/services/ticket-service.ts` las orquesta.
 */
import type { Attendee, CheckIn, Edition, Ticket } from "./types";
import type { ParsedToken } from "./ticket-token";
import { isValidEmail } from "./validation";

/**
 * Estado de un token QR frente a lo guardado.
 * - `valid`: firma correcta, la entrada existe, está vigente y la versión coincide.
 * - `transferred`: firma correcta pero la versión es anterior (la entrada se transfirió).
 * - `cancelled`: la orden se canceló.
 * - `unknown`: firma inválida o la entrada no existe en este navegador.
 */
export type TokenState = "valid" | "transferred" | "cancelled" | "unknown";

export function classifyToken(parsed: ParsedToken | null, ticket: Ticket | undefined): TokenState {
  if (!parsed || !ticket || ticket.id !== parsed.ticketId) return "unknown";
  if (ticket.status === "cancelled") return "cancelled";
  if (parsed.version !== ticket.version) return parsed.version < ticket.version ? "transferred" : "unknown";
  return ticket.status === "valid" ? "valid" : "unknown";
}

export interface TransferTarget {
  name: string;
  email: string;
}

export type TransferErrors = { name?: string; email?: string };

export type TargetCheck =
  | { ok: true; target: TransferTarget }
  | { ok: false; code: "invalid" | "same_holder"; message: string; errors: TransferErrors };

/**
 * Valida solo el formulario (nombre y correo de quien recibe). `currentEmail` es
 * el correo de la titular actual: no se puede transferir a la misma persona.
 */
export function checkTransferTarget(to: TransferTarget, currentEmail?: string): TargetCheck {
  const name = to.name.trim();
  const email = to.email.trim().toLowerCase();
  const errors: TransferErrors = {};
  if (name.length < 2) errors.name = "Escribe el nombre de quien recibe la entrada (mínimo 2 letras).";
  else if (name.length > 80) errors.name = "El nombre es demasiado largo.";
  if (!isValidEmail(email)) errors.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (errors.name || errors.email) {
    return { ok: false, code: "invalid", message: "Revisa los datos de quien recibe la entrada.", errors };
  }
  if (currentEmail && email === currentEmail.trim().toLowerCase()) {
    return {
      ok: false,
      code: "same_holder",
      message: "Ese correo ya es el de la titular de la entrada.",
      errors: { email: "Escribe el correo de otra persona." },
    };
  }
  return { ok: true, target: { name, email } };
}

export type TransferCheck =
  | { ok: true; target: TransferTarget }
  | {
      ok: false;
      code: "invalid" | "same_holder" | "not_valid" | "checked_in" | "past";
      message: string;
      errors?: TransferErrors;
    };

/** Valida las reglas de la entrada y el formulario de transferencia. Mensajes en español. */
export function checkTransfer(params: {
  ticket: Ticket;
  edition: Pick<Edition, "isPast"> | undefined;
  checkIns: readonly CheckIn[];
  to: TransferTarget;
}): TransferCheck {
  const { ticket, edition, checkIns } = params;

  if (ticket.status !== "valid") {
    return { ok: false, code: "not_valid", message: "Esta entrada ya no es válida, así que no se puede transferir." };
  }
  if (edition?.isPast) {
    return { ok: false, code: "past", message: "La edición ya ocurrió: la entrada no se puede transferir." };
  }
  if (checkIns.some((c) => c.ticketId === ticket.id && c.result === "valid")) {
    return { ok: false, code: "checked_in", message: "Esta entrada ya ingresó al evento y no se puede transferir." };
  }
  return checkTransferTarget(params.to, ticket.attendee.email);
}

/**
 * Aplica la transferencia: sube la versión (el QR anterior deja de valer),
 * reemplaza a la asistente y marca la fecha. Las respuestas a los campos por
 * asistente se vacían: eran de la titular anterior (p. ej. su talla).
 */
export function applyTransfer(ticket: Ticket, to: TransferTarget, now: Date = new Date()): Ticket {
  const attendee: Attendee = { name: to.name.trim(), email: to.email.trim().toLowerCase(), answers: {} };
  return {
    ...ticket,
    attendee,
    version: ticket.version + 1,
    status: "valid",
    transferredAt: now.toISOString(),
  };
}
