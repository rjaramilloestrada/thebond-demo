/**
 * Servicio de órdenes ya cobradas: cancelar (con o sin reembolso), liberar los
 * cupos y avisar a la lista de espera. La pantalla de administración (Fase 5)
 * llamará aquí; hoy lo cubren los tests y el E2E. Todo pasa por `@/adapters`.
 */
import { emails, payments, storage } from "@/adapters";
import type { ID, Order, Ticket, WaitlistEntry } from "@/domain/types";

export type CancelResult =
  | {
      ok: true;
      order: Order;
      tickets: Ticket[];
      /** Cupos que quedaron libres */
      freedSeats: number;
      /** Personas de la lista de espera avisadas, en el orden en que se anotaron */
      notified: WaitlistEntry[];
      /** Los correos se registran en segundo plano; la promesa nunca rechaza */
      followUps: Promise<void>;
    }
  | { ok: false; code: "not_found" | "not_paid" | "refund_failed"; message: string };

/**
 * Cancela una orden pagada.
 * - `refund: true` → la caja de pagos reembolsa y la orden queda `refunded`;
 *   si el reembolso falla no se toca nada.
 * - `refund: false` → la orden queda `cancelled`.
 * - Las entradas pasan a `cancelled` (sus QR dejan de valer) y los cupos se
 *   liberan (`holdsSeats` ya no cuenta la orden).
 * - Si la edición aún no ocurrió, por cada cupo liberado se avisa a una persona
 *   de la lista de espera que no haya sido avisada (la más antigua primero):
 *   correo `waitlist-available` + `notifiedAt`.
 */
export async function cancelOrder(orderId: ID, opts: { refund: boolean }): Promise<CancelResult> {
  const order = await storage.orders.get(orderId);
  if (!order) return { ok: false, code: "not_found", message: "No encontramos esta orden." };
  if (order.status !== "paid") {
    return { ok: false, code: "not_paid", message: "Solo se pueden cancelar órdenes pagadas." };
  }

  if (opts.refund) {
    const refund = await payments.refund(orderId);
    if (!refund.ok) return { ok: false, code: "refund_failed", message: refund.message };
  }

  const cancelled: Order = { ...order, status: opts.refund ? "refunded" : "cancelled" };
  await storage.orders.save(cancelled);

  const tickets = (await storage.tickets.list()).filter((t) => t.orderId === orderId);
  const cancelledTickets = tickets.map((t): Ticket => ({ ...t, status: "cancelled" }));
  for (const t of cancelledTickets) await storage.tickets.save(t);

  const freedSeats = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  const edition = await storage.editions.get(order.editionId);
  const notified: WaitlistEntry[] = [];
  if (edition && !edition.isPast) {
    const queue = (await storage.waitlist.list())
      .filter((w) => w.editionId === order.editionId && w.notifiedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const now = new Date().toISOString();
    for (const entry of queue.slice(0, freedSeats)) {
      const updated: WaitlistEntry = { ...entry, notifiedAt: now };
      await storage.waitlist.save(updated);
      notified.push(updated);
    }
  }

  const followUps = (async () => {
    try {
      await Promise.all(
        notified.map((w) => emails.send("waitlist-available", w.email, { toName: w.name, waitlistEntryId: w.id })),
      );
    } catch {
      // Son registros de demo: un fallo aquí no debe deshacer la cancelación
    }
  })();

  return { ok: true, order: cancelled, tickets: cancelledTickets, freedSeats, notified, followUps };
}
