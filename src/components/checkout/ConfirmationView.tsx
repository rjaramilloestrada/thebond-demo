"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Label } from "@/components/brand/Label";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { couponDiscountCents } from "@/domain/pricing";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { OrderSummary } from "./OrderSummary";
import { PrintedTicket } from "./PrintedTicket";
import { buildSummary } from "./summary";
import { checkoutHref, editionHref, emailHref, invoiceHref } from "@/lib/routes";
import { ReminderButton } from "@/components/post-compra/ReminderButton";

function Slot() {
  return (
    <div aria-hidden className="relative mx-auto h-5 w-full max-w-xl rounded-full bg-bond-night ring-1 ring-bond-cream/40">
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
    return <main id="contenido" aria-busy="true" className={shell} />;
  }

  if (!order || !edition || !summary) {
    return (
      <main id="contenido" className={shell}>
        <div className="container-editorial relative z-10 py-40">
          <h1 className="display-serif text-display-l">
            Orden no <span className="accent-italic text-bond-butter">encontrada</span>
          </h1>
          <p className="mt-6 max-w-md text-lead">Este navegador no tiene guardada esta orden.</p>
          <Link href="/" className={`${buttonBase} ${buttonTones.butter} mt-10`}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const shortCode = order.id.replace(/^ord-/, "").toUpperCase();
  const docBtn = `${buttonBase} ${buttonTones.outlineDark} w-full !min-h-12 !px-6 sm:w-auto`;
  const waitingBtn =
    "label-caps inline-flex min-h-12 w-full cursor-wait items-center justify-center rounded-sm border border-dashed border-bond-cream/70 px-6 text-bond-cream sm:w-auto";
  const preparing = !buyerMail || !invoice;

  return (
    <main id="contenido" className={shell}>
      <div className="sunset-sun opacity-50" aria-hidden style={{ ["--sun-x" as string]: "50%", ["--sun-y" as string]: "-20%" }} />
      <div className="container-editorial relative z-10 pb-24 pt-32 md:pb-36 md:pt-44">
        <Label className="text-bond-sand">Pago aprobado · Orden {shortCode}</Label>
        <h1 data-testid="confirmacion-titulo" className="display-serif mt-5 text-display-xl-long">
          You&rsquo;re <span className="accent-italic text-bond-butter">in.</span>
        </h1>
        <p className="mt-6 max-w-lg text-lead text-bond-cream">
          {tickets.length === 1 ? "Aquí está tu entrada." : `Aquí están tus ${tickets.length} entradas.`} Cada una tiene su QR
          único; en la puerta se escanea el de cada asistente.
        </p>
        <p className="mt-3 max-w-lg text-sm text-bond-sand">
          Es un demo: no se envió ningún correo ni se cobró nada. El registro del envío queda guardado en este navegador.
        </p>

        <div className="mt-14 md:mt-20">
          <Slot />
          <ol aria-label="Tus entradas" className="mx-auto -mt-1 flex w-full max-w-xl flex-col" data-testid="tickets">
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

        <div className="mx-auto mt-14 grid max-w-xl gap-10">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {buyerMail ? (
                <Link href={emailHref(buyerMail.id)} data-testid="ver-correo" className={docBtn}>
                  Ver correo
                </Link>
              ) : (
                <button type="button" disabled aria-describedby="preparando" data-testid="ver-correo" className={waitingBtn}>
                  Ver correo
                </button>
              )}
              {invoice ? (
                <Link href={invoiceHref(invoice.id)} data-testid="ver-factura" className={docBtn}>
                  Ver factura
                </Link>
              ) : (
                <button type="button" disabled aria-describedby="preparando" data-testid="ver-factura" className={waitingBtn}>
                  Ver factura
                </button>
              )}
              <ReminderButton ticketId={tickets[0]?.id} className={docBtn} />
            </div>
            <p id="preparando" role="status" className="mt-4 text-sm text-bond-sand">
              {preparing
                ? "Estamos preparando tu correo y tu factura…"
                : "Es un demo: el correo y la factura se muestran como vista previa, no se envían."}
            </p>
          </div>
          <div className="surface-dark">
            <OrderSummary data={summary} heading="Resumen de la orden" />
          </div>
          <Link href={editionHref(edition.slug)} className={`${buttonBase} ${buttonTones.butter} w-full`}>
            Volver a la edición
          </Link>
        </div>
      </div>
    </main>
  );
}
