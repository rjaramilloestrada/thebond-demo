"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { reconcileDraft, validateCheckoutForm } from "@/domain/checkout";
import { couponDiscountCents } from "@/domain/pricing";
import type { AttendeeField } from "@/domain/types";
import { expire } from "@/services/checkout-service";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { CheckoutHeader } from "./CheckoutHeader";
import { DataStep } from "./DataStep";
import { ExpiredModal } from "./ExpiredModal";
import { PaymentBox } from "./PaymentBox";
import { ReservationTimer } from "./ReservationTimer";
import { buildSummary } from "./summary";
import { confirmationHref, editionHref } from "@/lib/routes";

function Notice({ title, children, href, cta }: { title: string; children: React.ReactNode; href: string; cta: string }) {
  return (
    <div className="container-column py-16 md:py-24">
      <p className="display-serif text-display-m">{title}</p>
      <p className="mt-3 text-bond-olive">{children}</p>
      <Link href={href} className={`${buttonBase} ${buttonTones.olive} mt-8 w-full sm:w-fit`}>
        {cta}
      </Link>
    </div>
  );
}

/** Pantalla clara y callada: deja el alto del encabezado del sitio (absoluto) antes del contenido. */
const shell = "min-h-svh bg-bond-cream pt-[4.5rem] text-bond-night md:pt-24";

/**
 * Pantallas 2 y 3 del flujo de compra en `/comprar?orden=<id>`: datos y, con
 * `&paso=pago`, la caja de pagos. Lee la orden del store (se rehidrata tras el
 * primer render), muestra el contador de reserva y abre el aviso si la reserva
 * vence. Las escrituras de negocio van por `@/services/checkout-service`.
 */
export function CheckoutFlow({ orderId, step }: { orderId: string; step: "datos" | "pago" }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const order = useDbStore((s) => s.orders[orderId]);
  const editions = useDbStore((s) => s.editions);
  const allTicketTypes = useDbStore((s) => s.ticketTypes);
  const allFields = useDbStore((s) => s.attendeeFields);
  const coupons = useDbStore((s) => s.coupons);
  const storedDraft = useCheckoutDraftStore((s) => s.drafts[orderId]);
  const setDraft = useCheckoutDraftStore((s) => s.setDraft);
  const [paying, setPaying] = useState(false);

  const edition = order ? editions[order.editionId] : undefined;
  const ticketTypes = useMemo(
    () => Object.values(allTicketTypes).filter((t) => order && t.editionId === order.editionId),
    [allTicketTypes, order],
  );
  const fields = useMemo<AttendeeField[]>(
    () =>
      Object.values(allFields)
        .filter((f) => order && f.editionId === order.editionId)
        .sort((a, b) => a.order - b.order),
    [allFields, order],
  );
  const draft = useMemo(() => (order ? reconcileDraft(order, storedDraft) : undefined), [order, storedDraft]);
  const draftValid = useMemo(() => (draft ? validateCheckoutForm(draft, fields).valid : false), [draft, fields]);
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

  const status = order?.status;
  useEffect(() => {
    if (hydrated && status === "paid") router.replace(confirmationHref(orderId));
  }, [hydrated, status, orderId, router]);

  const onExpire = useCallback(() => {
    void expire(orderId);
  }, [orderId]);

  const backToEdition = useCallback(() => {
    router.push(edition ? editionHref(edition.slug) : "/");
  }, [router, edition]);

  if (!hydrated) {
    return (
      <main id="contenido" aria-busy="true" className={shell}>
        <CheckoutHeader title={step === "pago" ? "Pago" : "Tus datos"} />
      </main>
    );
  }

  if (!order || !edition || !draft || !summary) {
    return (
      <main id="contenido" className={shell}>
        <Notice title="No encontramos esta reserva" href="/" cta="Volver al inicio">
          Puede que el enlace sea incorrecto o que este navegador no la tenga guardada.
        </Notice>
      </main>
    );
  }

  const title = step === "pago" ? "Pago" : "Tus datos";

  if (status === "cancelled" || status === "refunded") {
    return (
      <main id="contenido" className={shell}>
        <Notice title="Esta orden ya no está disponible" href={editionHref(edition.slug)} cta="Volver a la edición">
          La orden fue cancelada. Puedes elegir tus entradas de nuevo.
        </Notice>
      </main>
    );
  }

  const expired = status === "expired";
  return (
    <main id="contenido" className={shell}>
      {status === "reserved" && order.reservationExpiresAt && (
        <ReservationTimer startedAt={order.createdAt} expiresAt={order.reservationExpiresAt} onExpire={onExpire} paused={paying} />
      )}
      <CheckoutHeader title={title} edition={edition} />
      {!expired && status === "reserved" && (
        step === "pago" ? (
          <PaymentBox order={order} draft={draft} draftValid={draftValid} summary={summary} onPayingChange={setPaying} />
        ) : (
          <DataStep
            order={order}
            ticketTypes={ticketTypes}
            fields={fields}
            draft={draft}
            onDraftChange={(next) => setDraft(orderId, next)}
            summary={summary}
          />
        )
      )}
      <ExpiredModal open={expired} onBack={backToEdition} />
    </main>
  );
}
