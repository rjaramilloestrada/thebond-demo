"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { buttonBase, buttonTones, quietLink } from "@/components/ui/button-styles";
import { couponDiscountCents } from "@/domain/pricing";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { PrintedTicket } from "./PrintedTicket";
import { buildSummary } from "./summary";
import { checkoutHref, editionHref, emailHref, invoiceHref } from "@/lib/routes";
import { ReminderButton } from "@/components/post-compra/ReminderButton";

function Slot() {
  return (
    <div aria-hidden className="relative h-5 w-full rounded-full bg-bond-night ring-1 ring-bond-cream/40">
      <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-bond-butter/70" />
    </div>
  );
}

/**
 * Confirmación (posterior al pago): un ticket por asistente con QR único que
 * sale de una ranura, con enlace a "Mi entrada". "Ver correo", "Ver factura" y
 * "Ver recordatorio" abren las vistas previas (el correo y la factura se
 * registran en segundo plano tras el pago, así que los botones se activan
 * cuando existen). Si la orden no está pagada, vuelve a `/comprar?orden=<id>`.
 */
export function ConfirmationView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const order = useDbStore((s) => s.orders[orderId]);
  const editions = useDbStore((s) => s.editions);
  const allTickets = useDbStore((s) => s.tickets);
  const allTicketTypes = useDbStore((s) => s.ticketTypes);
  const coupons = useDbStore((s) => s.coupons);
  const allEmails = useDbStore((s) => s.emails);
  const allInvoices = useDbStore((s) => s.invoices);

  const edition = order ? editions[order.editionId] : undefined;
  const tickets = useMemo(
    () =>
      Object.values(allTickets)
        .filter((t) => t.orderId === orderId)
        .sort((a, b) => a.id.localeCompare(b.id)),
    [allTickets, orderId],
  );
  const ticketTypes = useMemo(
    () => Object.values(allTicketTypes).filter((t) => order && t.editionId === order.editionId),
    [allTicketTypes, order],
  );
  const summary = useMemo(() => {
    if (!order) return undefined;
    const coupon = order.couponCode ? Object.values(coupons).find((c) => c.code === order.couponCode) ?? null : null;
    return buildSummary({
      lines: order.lines,
      ticketTypes,
      coupon,
      discountCents: coupon ? couponDiscountCents(coupon, order.subtotalCents) : order.discountCents,
    });
  }, [order, ticketTypes, coupons]);

  // Correo con todas las entradas (el de quien compra) y factura de la orden, si ya se registraron
  const buyerMail = useMemo(
    () =>
      order
        ? Object.values(allEmails)
            .filter((e) => e.template === "ticket" && e.orderId === orderId && e.to.toLowerCase() === order.buyer.email.toLowerCase())
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt))[0]
        : undefined,
    [allEmails, order, orderId],
  );
  const invoice = useMemo(() => Object.values(allInvoices).find((i) => i.orderId === orderId), [allInvoices, orderId]);

  const unpaid = hydrated && order && order.status !== "paid";
  useEffect(() => {
    if (unpaid) router.replace(checkoutHref(orderId));
  }, [unpaid, orderId, router]);

  const shell = "surface-dark grain relative isolate overflow-hidden bg-bond-night text-bond-cream";

  if (!hydrated || unpaid) {
    return <main id="contenido" aria-busy="true" className={`${shell} min-h-svh`} />;
  }

  if (!order || !edition || !summary) {
    return (
      <main id="contenido" className={`${shell} min-h-svh`}>
        <div className="container-column relative z-10 py-40">
          <h1 className="display-serif text-display-l">
            Orden no <span className="accent-italic text-bond-butter">encontrada</span>
          </h1>
          <p className="mt-6 text-lead">Este navegador no tiene guardada esta orden.</p>
          <Link href="/" className={`${buttonBase} ${buttonTones.cream} mt-10`}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const shortCode = order.id.replace(/^ord-/, "").toUpperCase();
  const link = `${quietLink} text-bond-cream hover:text-bond-butter`;
  const waiting = `${quietLink} cursor-wait text-bond-sand no-underline opacity-80`;
  const preparing = !buyerMail || !invoice;

  return (
    <main id="contenido" className={shell}>
      <div className="container-column relative z-10 pb-24 pt-32 md:pb-36 md:pt-44">
        <p className="label-caps text-bond-sand">Orden {shortCode}</p>
        <h1 data-testid="confirmacion-titulo" className="display-serif mt-5 text-display-xl-long">
          You&rsquo;re <span className="accent-italic text-bond-butter">in.</span>
        </h1>
        <p className="mt-5 text-lead text-bond-cream">
          {tickets.length === 1 ? "Aquí está tu entrada." : `Aquí están tus ${tickets.length} entradas.`}
        </p>

        <div className="mt-14 md:mt-20">
          <Slot />
          <ol aria-label="Tus entradas" className="-mt-1 flex w-full flex-col" data-testid="tickets">
            {tickets.map((t, i) => (
              <PrintedTicket
                key={t.id}
                ticket={t}
                ticketType={ticketTypes.find((tt) => tt.id === t.ticketTypeId)}
                edition={edition}
                index={i}
                total={tickets.length}
              />
            ))}
          </ol>
        </div>

        <nav aria-label="Documentos de tu compra" className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-1">
          {buyerMail ? (
            <Link href={emailHref(buyerMail.id)} data-testid="ver-correo" className={link}>
              Ver correo
            </Link>
          ) : (
            <button type="button" disabled aria-describedby="preparando" data-testid="ver-correo" className={waiting}>
              Ver correo
            </button>
          )}
          {invoice ? (
            <Link href={invoiceHref(invoice.id)} data-testid="ver-factura" className={link}>
              Ver factura
            </Link>
          ) : (
            <button type="button" disabled aria-describedby="preparando" data-testid="ver-factura" className={waiting}>
              Ver factura
            </button>
          )}
          <ReminderButton ticketId={tickets[0]?.id} className={link} />
        </nav>
        <p id="preparando" role="status" className="mt-2 min-h-5 text-xs text-bond-sand">
          {preparing ? "Preparando tu correo y tu factura…" : ""}
        </p>

        <p className="mt-10">
          <Link href={editionHref(edition.slug)} className={link}>
            <span aria-hidden className="mr-3">←</span>
            Volver a la edición
          </Link>
        </p>
      </div>
    </main>
  );
}
