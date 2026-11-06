"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pending, WhenShowingPending } from "@/components/Pending";
import { buttonBase, buttonTones, quietLink } from "@/components/ui/button-styles";
import { ErrorIcon, TextField } from "@/components/ui/Field";
import type { CheckoutDraft } from "@/domain/checkout";
import type { Order } from "@/domain/types";
import { pay } from "@/services/checkout-service";
import { barButton, CheckoutBar } from "./CheckoutBar";
import { OrderSummary } from "./OrderSummary";
import type { SummaryData } from "./summary";
import { checkoutHref, confirmationHref } from "@/lib/routes";

const TEST_CARD = { number: "4000 0000 0000 0000", expiry: "12/30", cvc: "123" } as const;

function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function validateCard(card: { number: string; expiry: string; cvc: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  const digits = card.number.replace(/\D/g, "");
  if (digits.length < 13) errors.number = "Escribe el número completo de la tarjeta.";
  const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) errors.expiry = "Escribe el vencimiento como MM/AA.";
  if (!/^\d{3,4}$/.test(card.cvc)) errors.cvc = "El código de seguridad tiene 3 o 4 dígitos.";
  return errors;
}

/**
 * Pantalla 3 · Caja de pagos: tarjeta de prueba prellenada y "Pagar". El botón
 * muestra el estado de carga durante la latencia del mock. Si la caja rechaza, un
 * banner explica qué pasó y "Reintentar" vuelve a cobrar con los mismos datos.
 */
export function PaymentBox({
  order,
  draft,
  draftValid,
  summary,
  onPayingChange,
}: {
  order: Order;
  draft: CheckoutDraft;
  draftValid: boolean;
  summary: SummaryData;
  onPayingChange: (paying: boolean) => void;
}) {
  const router = useRouter();
  const [card, setCard] = useState<{ number: string; expiry: string; cvc: string }>({ ...TEST_CARD });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [failure, setFailure] = useState<{ message: string; attempts: number } | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failure) alertRef.current?.focus();
  }, [failure]);

  const label = paying ? "Procesando el pago…" : failure ? "Reintentar pago" : `Pagar ${summary.total}`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (paying || !draftValid) return;
    const errors = validateCard(card);
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) {
      document.getElementById(`card-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    setPaying(true);
    onPayingChange(true);
    const result = await pay(order.id, draft);
    if (result.ok) {
      router.push(confirmationHref(order.id));
      return;
    }
    setPaying(false);
    onPayingChange(false);
    // Si venció, el padre abre el aviso porque la orden pasa a `expired`
    if (result.code === "expired") return;
    setFailure({ message: result.message, attempts: (failure?.attempts ?? 0) + 1 });
  }

  if (!draftValid) {
    return (
      <div className="container-column pb-32 pt-10 md:pt-12">
        <div role="alert" data-testid="datos-incompletos">
          <p className="display-serif text-display-m">Faltan tus datos</p>
          <p className="mt-3 text-bond-olive">Antes de pagar necesitamos los datos de la compra y de cada asistente.</p>
          <Link href={checkoutHref(order.id)} className={`${buttonBase} ${buttonTones.olive} mt-8 w-full sm:w-fit`}>
            Completar mis datos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-column pb-40 pt-10 md:pt-12 lg:pb-24">
      <form id="pago-form" onSubmit={onSubmit} noValidate aria-busy={paying}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="label-caps text-bond-olive">Tarjeta</h2>
          <p data-testid="tarjeta-de-prueba" className="text-xs text-bond-olive">
            Tarjeta de prueba · no se cobra nada
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <TextField
            id="card-number"
            label="Número de tarjeta"
            inputMode="numeric"
            autoComplete="cc-number"
            value={card.number}
            onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
            error={cardErrors.number}
            disabled={paying}
            className="col-span-2"
          />
          <TextField
            id="card-expiry"
            label="Vencimiento"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
            error={cardErrors.expiry}
            disabled={paying}
          />
          <TextField
            id="card-cvc"
            label="Código (CVC)"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            value={card.cvc}
            onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            error={cardErrors.cvc}
            disabled={paying}
          />
        </div>

        {failure && (
          <div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            data-testid="pago-rechazado"
            className="mt-8 border-l-2 border-bond-ember bg-bond-sand/40 p-5 text-bond-night"
          >
            <p className="flex items-start gap-2 font-medium">
              <ErrorIcon />
              <span>Pago rechazado</span>
            </p>
            <p className="mt-2 pl-7 text-sm">{failure.message}</p>
            <p className="mt-2 pl-7 text-sm">Tus datos siguen guardados: puedes reintentar o volver a revisarlos.</p>
          </div>
        )}

        <div className="mt-10 hidden lg:block">
          <button
            type="submit"
            disabled={paying}
            data-testid="pagar"
            className={`${buttonBase} ${buttonTones.olive} w-full disabled:cursor-wait disabled:opacity-70`}
          >
            {label}
            {!paying && <span aria-hidden>→</span>}
          </button>
        </div>
        <WhenShowingPending>
          <p className="mt-4 text-sm text-bond-olive">
            Texto legal: <Pending text="[[PENDIENTE: texto legal del checkout (términos, privacidad y reembolsos)]]" />
          </p>
        </WhenShowingPending>
        <span role="status" aria-live="polite" className="sr-only">
          {paying ? "Procesando el pago…" : ""}
        </span>
      </form>

      <OrderSummary data={summary} className="mt-12" />

      <p className="mt-6">
        <Link href={checkoutHref(order.id)} className={`${quietLink} text-bond-night`}>
          <span aria-hidden className="mr-3">←</span>
          Volver a mis datos
        </Link>
      </p>

      <CheckoutBar total={summary.total}>
        <button type="submit" form="pago-form" disabled={paying} data-testid="pagar-barra" className={barButton}>
          {label}
          {!paying && <span aria-hidden>→</span>}
        </button>
      </CheckoutBar>
    </div>
  );
}
