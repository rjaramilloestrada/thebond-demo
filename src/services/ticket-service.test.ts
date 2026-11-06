import { beforeEach, describe, expect, it } from "vitest";
import { storage } from "@/adapters";
import { configureLatency } from "@/adapters/mock/latency";
import { classifyToken } from "@/domain/tickets";
import { createTicketToken, verifyTicketToken } from "@/domain/ticket-token";
import type { Ticket } from "@/domain/types";
import { useDbStore } from "@/store/db-store";
import { DEFAULT_FLAGS, useDemoStore } from "@/store/demo-store";
import { ensureReminder, resolveToken, transferTicket } from "./ticket-service";

/** Primera entrada de la ed. 002 (en venta): ticket semilla con versión 1. */
async function sampleTicket(): Promise<Ticket> {
  const t = (await storage.tickets.list()).find((x) => x.editionId === "ed-002" && x.status === "valid");
  if (!t) throw new Error("sin entradas de la ed. 002");
  return t;
}

beforeEach(() => {
  configureLatency({ min: 0, max: 0 });
  useDbStore.getState().resetDemo();
  useDemoStore.setState({ ...DEFAULT_FLAGS });
});

describe("resolveToken", () => {
  it("token vigente → valid", async () => {
    const t = await sampleTicket();
    const r = await resolveToken(await createTicketToken(t.id, t.version));
    expect(r.state).toBe("valid");
    expect(r.ticket?.id).toBe(t.id);
  });

  it("firma falsa, basura o entrada inexistente → unknown", async () => {
    const t = await sampleTicket();
    const token = await createTicketToken(t.id, t.version);
    expect((await resolveToken(`${token.slice(0, -2)}xx`)).state).toBe("unknown");
    expect((await resolveToken("no-es-un-token")).state).toBe("unknown");
    expect((await resolveToken(await createTicketToken("tk-no-existe", 1))).state).toBe("unknown");
  });

  it("classifyToken: versión futura o estado raro no es válido", () => {
    expect(classifyToken(null, undefined)).toBe("unknown");
  });
});

describe("ticket-service · transferencia", () => {
  it("sube la versión, reemplaza a la asistente, marca transferredAt e invalida el QR anterior", async () => {
    const t = await sampleTicket();
    const oldToken = await createTicketToken(t.id, t.version);

    const r = await transferTicket(t.id, t.version, { name: "  Nueva Titular ", email: "NUEVA@Ejemplo.com " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.ticket.version).toBe(t.version + 1);
    expect(r.ticket.attendee).toEqual({ name: "Nueva Titular", email: "nueva@ejemplo.com", answers: {} });
    expect(r.ticket.transferredAt).not.toBeNull();
    expect(r.ticket.status).toBe("valid");
    const stored = await storage.tickets.get(t.id);
    expect(stored?.version).toBe(t.version + 1);

    // El QR anterior: la firma sigue siendo correcta pero ya no coincide con la versión guardada
    expect(await verifyTicketToken(oldToken)).toEqual({ ticketId: t.id, version: t.version });
    expect((await resolveToken(oldToken)).state).toBe("transferred");
    // El nuevo token sí vale
    expect(await verifyTicketToken(r.token)).toEqual({ ticketId: t.id, version: t.version + 1 });
    expect((await resolveToken(r.token)).state).toBe("valid");
    expect(r.token).not.toBe(oldToken);
  });

  it("registra dos correos `transfer`: a quien recibe y a quien la tenía", async () => {
    const t = await sampleTicket();
    const r = await transferTicket(t.id, t.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    if (!r.ok) throw new Error("transferencia");
    await r.followUps;
    const sent = (await storage.emails.list()).filter((e) => e.template === "transfer" && e.ticketId === t.id);
    expect(sent).toHaveLength(2);
    const toNew = sent.find((e) => e.to === "nueva@ejemplo.com");
    const toOld = sent.find((e) => e.to === t.attendee.email);
    expect(toNew?.transfer?.role).toBe("new-holder");
    expect(toNew?.ticketRefs).toEqual([{ ticketId: t.id, version: t.version + 1, attendeeName: "Nueva Titular" }]);
    expect(toOld?.transfer?.role).toBe("previous-holder");
    expect(toOld?.ticketRefs).toEqual([{ ticketId: t.id, version: t.version, attendeeName: t.attendee.name }]);
    expect(toOld?.subject).toMatch(/Transferiste/);
    expect(toNew?.subject).toMatch(/transfirieron/);
  });

  it("no deja transferir dos veces con el mismo enlace (versión vieja)", async () => {
    const t = await sampleTicket();
    const first = await transferTicket(t.id, t.version, { name: "Primera Titular", email: "primera@ejemplo.com" });
    expect(first.ok).toBe(true);
    const again = await transferTicket(t.id, t.version, { name: "Segunda Titular", email: "segunda@ejemplo.com" });
    expect(again.ok).toBe(false);
    expect(!again.ok && again.code).toBe("stale");
    expect((await storage.tickets.get(t.id))?.attendee.email).toBe("primera@ejemplo.com");
  });

  it("valida nombre y correo, y rechaza transferirse a sí misma", async () => {
    const t = await sampleTicket();
    const bad = await transferTicket(t.id, t.version, { name: "A", email: "no-es-correo" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.code).toBe("invalid");
      expect(bad.errors?.name).toBeTruthy();
      expect(bad.errors?.email).toBeTruthy();
    }
    const same = await transferTicket(t.id, t.version, { name: "Otra Persona", email: t.attendee.email.toUpperCase() });
    expect(!same.ok && same.code).toBe("same_holder");
    expect((await storage.tickets.get(t.id))?.version).toBe(t.version);
  });

  it("no transfiere entradas canceladas, ya ingresadas ni de ediciones pasadas", async () => {
    const t = await sampleTicket();
    await storage.tickets.save({ ...t, status: "cancelled" });
    const cancelled = await transferTicket(t.id, t.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    expect(!cancelled.ok && cancelled.code).toBe("not_valid");
    await storage.tickets.save(t);

    await storage.checkIns.save({ id: "ci-test", ticketId: t.id, editionId: t.editionId, at: new Date().toISOString(), result: "valid" });
    const used = await transferTicket(t.id, t.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    expect(!used.ok && used.code).toBe("checked_in");

    const past = (await storage.tickets.list()).find((x) => x.editionId === "ed-001");
    if (!past) throw new Error("sin entradas de la ed. 001");
    const old = await transferTicket(past.id, past.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    expect(!old.ok && old.code).toBe("past");
    expect((await transferTicket("tk-no-existe", 1, { name: "Nueva Titular", email: "nueva@ejemplo.com" })).ok).toBe(false);
  });
});

describe("ticket-service · recordatorio", () => {
  it("crea el correo de recordatorio una sola vez por versión del QR", async () => {
    const t = await sampleTicket();
    const a = await ensureReminder(t.id);
    const b = await ensureReminder(t.id);
    expect(a?.template).toBe("reminder");
    expect(a?.to).toBe(t.attendee.email);
    expect(b?.id).toBe(a?.id);
    expect((await storage.emails.list()).filter((e) => e.template === "reminder")).toHaveLength(1);

    // Tras transferir, el recordatorio es para la nueva titular
    const r = await transferTicket(t.id, t.version, { name: "Nueva Titular", email: "nueva@ejemplo.com" });
    if (!r.ok) throw new Error("transferencia");
    const c = await ensureReminder(t.id);
    expect(c?.to).toBe("nueva@ejemplo.com");
    expect(c?.id).not.toBe(a?.id);
  });

  it("no hay recordatorio para una entrada inexistente o cancelada", async () => {
    expect(await ensureReminder("tk-no-existe")).toBeUndefined();
    const t = await sampleTicket();
    await storage.tickets.save({ ...t, status: "cancelled" });
    expect(await ensureReminder(t.id)).toBeUndefined();
  });
});
