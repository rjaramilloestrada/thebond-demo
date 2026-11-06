"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { attendeeSlots, validateCheckoutForm, type CheckoutDraft } from "@/domain/checkout";
import type { AttendeeField, Order, TicketType } from "@/domain/types";
import { checkoutHref } from "@/lib/routes";
import { AttendeeForm } from "./AttendeeForm";
import { BuyerForm } from "./BuyerForm";
import { barButton, CheckoutBar } from "./CheckoutBar";
import { OrderSummary } from "./OrderSummary";
import type { SummaryData } from "./summary";
import { TaxIdField } from "./TaxIdField";

/**
 * Pantalla 2 · Datos, en una columna: comprador, un bloque colapsable por
 * asistente (campos configurables) y cédula o RUC. Valida al salir de cada campo y
 * al enviar; al fallar se abre el bloque con el primer error y el foco va a ese
 * campo. "Ir a pagar" pasa al paso de pago (`?paso=pago`).
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
  const [openSet, setOpenSet] = useState<ReadonlySet<number>>(new Set([0]));
  const validation = useMemo(() => validateCheckoutForm(draft, fields), [draft, fields]);
  const slots = useMemo(() => attendeeSlots(order), [order]);

  const touch = (key: string) => setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const errorFor = (key: string) => (submitted || touched.has(key) ? validation.errors[key] : undefined);
  const errorCount = Object.keys(validation.errors).length;
  const attendeeComplete = (i: number) => !Object.keys(validation.errors).some((k) => k.startsWith(`attendees.${i}.`));
  const setOpen = (i: number, open: boolean) =>
    setOpenSet((prev) => {
      if (prev.has(i) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(i);
      else next.delete(i);
      return next;
    });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      const first = Object.keys(validation.errors)[0];
      const m = /^attendees\.(\d+)\./.exec(first);
      if (m) setOpen(Number(m[1]), true);
      const target = () => document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      // Un campo dentro de un bloque cerrado se enfoca cuando el bloque ya se abrió
      if (m) window.setTimeout(() => target()?.focus(), 60);
      else target()?.focus();
      return;
    }
    router.push(checkoutHref(order.id, "pago"));
  }

  const canUseBuyer = Boolean(draft.buyer.name.trim() || draft.buyer.email.trim());

  return (
    <div className="container-column pb-40 pt-10 md:pt-12 lg:pb-24">
      <form id="datos-form" onSubmit={onSubmit} noValidate className="grid gap-14">
        <BuyerForm
          value={draft.buyer}
          onChange={(buyer) => onDraftChange({ ...draft, buyer })}
          errorFor={errorFor}
          onBlurField={touch}
        />

        <section aria-labelledby="sec-asistentes">
          <h2 id="sec-asistentes" className="label-caps mb-2 text-bond-olive">
            {slots.length === 1 ? "Quién asiste" : "Quiénes asisten"}
          </h2>
          <div className="border-t border-bond-night/20">
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
                open={openSet.has(i)}
                onOpenChange={(open) => setOpen(i, open)}
                complete={attendeeComplete(i)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="sec-factura">
          <h2 id="sec-factura" className="label-caps mb-4 text-bond-olive">
            Factura
          </h2>
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

      <OrderSummary data={summary} className="mt-14" />

      <div className="mt-8 hidden lg:block">
        <button type="submit" form="datos-form" data-testid="ir-a-pagar" className={`${buttonBase} ${buttonTones.olive} w-full`}>
          Ir a pagar <span aria-hidden>→</span>
        </button>
      </div>

      <CheckoutBar total={summary.total}>
        <button type="submit" form="datos-form" data-testid="ir-a-pagar-barra" className={barButton}>
          Ir a pagar <span aria-hidden>→</span>
        </button>
      </CheckoutBar>
    </div>
  );
}
