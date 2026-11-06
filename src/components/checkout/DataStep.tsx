"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import {
  attendeeSlots,
  validateCheckoutForm,
  type CheckoutDraft,
} from "@/domain/checkout";
import type { AttendeeField, Order, TicketType } from "@/domain/types";
import { AttendeeForm } from "./AttendeeForm";
import { BuyerForm } from "./BuyerForm";
import { barButton, CheckoutBar } from "./CheckoutBar";
import { OrderSummary } from "./OrderSummary";
import type { SummaryData } from "./summary";
import { TaxIdField } from "./TaxIdField";
import { checkoutHref } from "@/lib/routes";

function SectionTitle({ n, id, children }: { n: string; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-baseline gap-4">
      <span aria-hidden className="font-display text-2xl italic text-bond-olive">
        {n}
      </span>
      <span className="display-serif text-heading">{children}</span>
    </h2>
  );
}

/**
 * Pantalla 2 · Datos: comprador, un bloque por asistente (campos configurables)
 * y cédula o RUC. Valida al salir de cada campo y al enviar; al fallar, el foco
 * va al primer error. "Ir a pagar" pasa al paso de pago (`?paso=pago`).
 */
export function DataStep({
  order,
  ticketTypes,
  fields,
  draft,
  onDraftChange,
  summary,
}: {
  order: Order;
  ticketTypes: TicketType[];
  fields: AttendeeField[];
  draft: CheckoutDraft;
  onDraftChange: (next: CheckoutDraft) => void;
  summary: SummaryData;
}) {
  const router = useRouter();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const validation = useMemo(() => validateCheckoutForm(draft, fields), [draft, fields]);
  const slots = useMemo(() => attendeeSlots(order), [order]);

  const touch = (key: string) => setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const errorFor = (key: string) => (submitted || touched.has(key) ? validation.errors[key] : undefined);
  const errorCount = Object.keys(validation.errors).length;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      const first = Object.keys(validation.errors)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    router.push(checkoutHref(order.id, "pago"));
  }

  const canUseBuyer = Boolean(draft.buyer.name.trim() || draft.buyer.email.trim());

  return (
    <div className="container-editorial py-12 pb-32 md:py-20 lg:pb-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <form id="datos-form" onSubmit={onSubmit} noValidate className="grid gap-14">
          <section aria-labelledby="sec-comprador" className="grid gap-6">
            <SectionTitle n="01" id="sec-comprador">
              Tus datos
            </SectionTitle>
            <BuyerForm
              value={draft.buyer}
              onChange={(buyer) => onDraftChange({ ...draft, buyer })}
              errorFor={errorFor}
              onBlurField={touch}
            />
          </section>

          <section aria-labelledby="sec-asistentes" className="grid gap-6">
            <SectionTitle n="02" id="sec-asistentes">
              {slots.length === 1 ? "Quién asiste" : "Quiénes asisten"}
            </SectionTitle>
            <p className="max-w-xl text-bond-olive">
              Cada entrada va a nombre de una persona. Su QR llega al correo que escribas aquí.
            </p>
            <div className="grid gap-6">
              {slots.map((typeId, i) => (
                <AttendeeForm
                  key={i}
                  index={i}
                  ticketType={ticketTypes.find((t) => t.id === typeId)}
                  fields={fields}
                  value={draft.attendees[i]}
                  onChange={(next) =>
                    onDraftChange({ ...draft, attendees: draft.attendees.map((a, j) => (j === i ? next : a)) })
                  }
                  errorFor={errorFor}
                  onBlurField={touch}
                  canUseBuyer={canUseBuyer}
                  onUseBuyer={() =>
                    onDraftChange({
                      ...draft,
                      attendees: draft.attendees.map((a, j) =>
                        j === 0 ? { ...a, name: draft.buyer.name, email: draft.buyer.email } : a,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="sec-factura" className="grid max-w-xl gap-6">
            <SectionTitle n="03" id="sec-factura">
              Factura
            </SectionTitle>
            <TaxIdField
              value={draft.taxId}
              onChange={(taxId) => onDraftChange({ ...draft, taxId })}
              onBlur={() => touch("taxId")}
              error={errorFor("taxId")}
            />
          </section>

          <span role="status" aria-live="polite" className="sr-only">
            {submitted && errorCount > 0 ? `Hay ${errorCount} ${errorCount === 1 ? "campo" : "campos"} por revisar.` : ""}
          </span>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary data={summary} />
          <div className="hidden lg:block">
            <button
              type="submit"
              form="datos-form"
              data-testid="ir-a-pagar"
              className={`${buttonBase} ${buttonTones.night} mt-4 w-full`}
            >
              Ir a pagar <span aria-hidden>→</span>
            </button>
            <p className="mt-3 text-sm text-bond-olive">El siguiente paso es la caja de pagos. Todavía no se cobra nada.</p>
          </div>
        </aside>
      </div>

      <CheckoutBar total={summary.total} isExample={summary.isExample}>
        <button type="submit" form="datos-form" data-testid="ir-a-pagar-barra" className={barButton}>
          Ir a pagar <span aria-hidden>→</span>
        </button>
      </CheckoutBar>
    </div>
  );
}
