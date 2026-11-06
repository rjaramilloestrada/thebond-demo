"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pending } from "@/components/Pending";
import { formatClock, useNow } from "@/components/checkout/hooks";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { buildSummary } from "@/components/checkout/summary";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { ErrorIcon } from "@/components/ui/Field";
import { availableForCounts, previewLines, selectableMax } from "@/domain/checkout";
import { couponDiscountCents, formatMoney, getStageStatuses } from "@/domain/pricing";
import type { EditionLive } from "@/domain/selectors";
import type { PriceStage, StageStatus, TicketType } from "@/domain/types";
import { previewCoupon } from "@/services/checkout-service";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { useDbStore } from "@/store/db-store";
import { selectionTotal, useSelectionStore } from "@/store/selection-store";
import { useEditionLive } from "./useEditionLive";
import { useReserve } from "./useReserve";
import { WaitlistForm } from "./WaitlistForm";

function Price({ stage, className = "" }: { stage: PriceStage; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-2xl leading-none md:text-3xl">
        {formatMoney(stage.amountCents, { isExample: stage.isExample })}
      </span>
      {stage.isExample && <span className="text-xs">ejemplo</span>}
    </span>
  );
}

const STATUS_COPY: Record<StageStatus, string> = {
  active: "Etapa actual",
  upcoming: "Próximamente",
  past: "Agotada",
};

function StageRow({ stage, status }: { stage: PriceStage; status: StageStatus }) {
  const active = status === "active";
  const past = status === "past";
  return (
    <li
      aria-current={active ? "step" : undefined}
      className={`flex items-center justify-between gap-4 py-4 ${active ? "text-bond-night" : "text-bond-olive"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={`size-3 shrink-0 rounded-full border-2 ${
            active ? "border-bond-night bg-bond-night" : past ? "border-bond-olive bg-bond-olive" : "border-bond-olive"
          }`}
        />
        <div className="min-w-0">
          <p className={`text-base ${active ? "font-semibold" : "font-medium"} ${past ? "line-through" : ""}`}>
            {stage.label}
          </p>
          <p className="label-caps mt-0.5">
            {active ? (
              <span className="inline-block rounded-sm bg-bond-night px-2 py-1 text-bond-butter">{STATUS_COPY[status]}</span>
            ) : (
              STATUS_COPY[status]
            )}
          </p>
        </div>
      </div>
      <Price stage={stage} className={past ? "line-through" : ""} />
    </li>
  );
}

/** Aviso para retomar una reserva en curso de este navegador. */
function ResumeBanner({ editionId }: { editionId: string }) {
  const activeId = useCheckoutDraftStore((s) => s.activeOrderByEdition[editionId]);
  const order = useDbStore((s) => (activeId ? s.orders[activeId] : undefined));
  const now = useNow(1000, Boolean(order));
  if (!order || order.status !== "reserved" || !order.reservationExpiresAt) return null;
  const remaining = new Date(order.reservationExpiresAt).getTime() - now;
  if (remaining <= 0) return null;
  const qty = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  return (
    <div className="paper-edge mb-8 flex flex-col gap-4 bg-bond-butter p-5 text-bond-night md:flex-row md:items-center md:justify-between">
      <p>
        Tienes una reserva en curso: {qty} {qty === 1 ? "entrada" : "entradas"}.{" "}
        <span className="font-medium">Vence en {formatClock(remaining)}.</span>
      </p>
      <Link href={`/comprar/${order.id}`} className={`${buttonBase} ${buttonTones.night} md:shrink-0`}>
        Retomar mi compra
      </Link>
    </div>
  );
}

function QuantityStepper({
  tt,
  value,
  max,
  disabled,
  onChange,
}: {
  tt: TicketType;
  value: number;
  max: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  const qtyId = `qty-${tt.id}`;
  const btn =
    "size-12 text-xl text-bond-night transition-colors hover:bg-bond-night hover:text-bond-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-bond-night";
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <label htmlFor={qtyId} className="label-caps text-bond-olive">
        Cantidad
        <span className="mt-1 block normal-case tracking-normal text-xs text-bond-olive">
          Máx. {tt.maxPerOrder} por orden
        </span>
      </label>
      <div role="group" aria-label={`Cantidad de ${tt.name.replace(/\[\[PENDIENTE: ([^\]]*)\]\]/, "$1")}`} className="inline-flex items-center border border-bond-night">
        <button type="button" aria-label="Menos" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btn}>
          −
        </button>
        <output id={qtyId} aria-live="polite" data-testid={`qty-${tt.id}`} className="w-10 text-center font-display text-xl tabular-nums text-bond-night">
          {value}
        </output>
        <button type="button" aria-label="Más" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={btn}>
          +
        </button>
      </div>
    </div>
  );
}

type CouponMessage = { kind: "ok" | "error"; text: string } | null;

function CouponBox({ editionId, subtotalCents, disabled }: { editionId: string; subtotalCents: number; disabled: boolean }) {
  const coupon = useSelectionStore((s) => s.coupon);
  const setCoupon = useSelectionStore((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<CouponMessage>(null);
  const [checking, setChecking] = useState(false);

  async function apply() {
    setChecking(true);
    const result = await previewCoupon(code, editionId, subtotalCents);
    setChecking(false);
    if (result.ok) {
      setCoupon(result.coupon);
      setMessage({
        kind: "ok",
        text:
          result.coupon.kind === "percent"
            ? `${result.coupon.code} aplicado: −${result.coupon.value} %`
            : `${result.coupon.code} aplicado.`,
      });
    } else {
      setCoupon(null);
      setMessage({ kind: "error", text: result.message });
    }
  }

  function remove() {
    setCoupon(null);
    setCode("");
    setMessage(null);
  }

  const error = message?.kind === "error";
  return (
    <div className="max-w-md">
      <label htmlFor="cupon" className="label-caps text-bond-olive">
        Cupón
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!coupon && !checking && !disabled) void apply();
        }}
        className="mt-1 flex items-end gap-3"
      >
        <input
          id="cupon"
          name="cupon"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={disabled || Boolean(coupon)}
          value={coupon ? coupon.code : code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de cupón"
          aria-invalid={error ? true : undefined}
          aria-describedby="cupon-resultado"
          className={`min-h-12 w-full min-w-0 border-0 border-b-2 bg-transparent px-0 py-2 text-lg uppercase text-bond-night placeholder:normal-case placeholder:text-bond-olive disabled:opacity-70 ${
            error ? "border-bond-ember" : "border-bond-night/70"
          }`}
        />
        {coupon ? (
          <button type="button" onClick={remove} className={`${buttonBase} ${buttonTones.outlineLight} !min-h-12 !px-5`}>
            Quitar
          </button>
        ) : (
          <button type="submit" disabled={disabled || checking || !code.trim()} className={`${buttonBase} ${buttonTones.outlineLight} !min-h-12 !px-5 disabled:cursor-not-allowed disabled:opacity-50`}>
            {checking ? "Revisando…" : "Aplicar"}
          </button>
        )}
      </form>
      <p id="cupon-resultado" role="status" aria-live="polite" className="mt-2 min-h-6 text-sm font-medium text-bond-night">
        {message && (
          <span className="flex items-start gap-2" data-testid={error ? "cupon-error" : "cupon-ok"}>
            {error ? (
              <ErrorIcon />
            ) : (
              <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="10" cy="10" r="8.2" />
                <path d="m6.2 10.3 2.7 2.7 5-5.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>{message.text}</span>
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Selector de entradas (brief 6.2, paso 1). Marca la etapa actual, deja la
 * siguiente en "Próximamente" y tacha las agotadas. Cantidad por tipo (tope por
 * orden y cupos disponibles), cupón con "Aplicar", resumen con montos de ejemplo
 * y "Continuar", que reserva los cupos y lleva a los datos. Si la edición está
 * agotada muestra la lista de espera.
 */
export function TicketSelector({
  ticketTypes,
  editionId,
  initial,
}: {
  ticketTypes: TicketType[];
  editionId: string;
  initial: EditionLive;
}) {
  const live = useEditionLive(initial);
  const quantities = useSelectionStore((s) => s.quantities);
  const coupon = useSelectionStore((s) => s.coupon);
  const error = useSelectionStore((s) => s.error);
  const reserving = useSelectionStore((s) => s.reserving);
  const reserve = useReserve(editionId);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const { init, reset } = useSelectionStore.getState();
    init(editionId);
    return () => reset();
  }, [editionId]);

  const maxByType = useMemo(
    () =>
      Object.fromEntries(
        ticketTypes.map((tt) => [
          tt.id,
          selectableMax(
            tt,
            availableForCounts({ ticketType: tt, soldOfType: live.soldByType[tt.id] ?? 0, editionRemaining: live.remaining }),
          ),
        ]),
      ) as Record<string, number>,
    [ticketTypes, live.soldByType, live.remaining],
  );

  // Si los cupos bajan (ventas en vivo), la selección se ajusta al nuevo tope
  useEffect(() => {
    const { quantities: q, setQuantity } = useSelectionStore.getState();
    for (const tt of ticketTypes) {
      if ((q[tt.id] ?? 0) > maxByType[tt.id]) setQuantity(tt.id, maxByType[tt.id]);
    }
  }, [ticketTypes, maxByType]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const lines = useMemo(() => previewLines(ticketTypes, quantities, live.soldByType), [ticketTypes, quantities, live.soldByType]);
  const summary = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
    return buildSummary({
      lines,
      ticketTypes,
      coupon,
      discountCents: coupon ? couponDiscountCents(coupon, subtotal) : 0,
    });
  }, [lines, ticketTypes, coupon]);
  const count = selectionTotal(quantities);
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
  const ready = live.hydrated;

  if (live.soldOut) {
    return (
      <div id="lista-de-espera" className="scroll-mt-4 max-w-2xl">
        <p className="display-serif text-display-m">
          All spots <span className="accent-italic text-bond-ember">taken.</span>
        </p>
        <p className="mt-4 mb-10 text-lead text-bond-olive">Esta edición se agotó. Anótate en la lista de espera.</p>
        <WaitlistForm editionId={editionId} tone="light" />
      </div>
    );
  }

  return (
    <div>
      <ResumeBanner editionId={editionId} />
      <ul className="grid gap-6 md:grid-cols-2 md:gap-8">
        {ticketTypes.map((tt) => {
          const sold = live.soldByType[tt.id] ?? 0;
          const stages = getStageStatuses(tt.stages, sold);
          const exhausted = stages.every((s) => s.status === "past");
          const max = maxByType[tt.id] ?? 0;
          const left = availableForCounts({ ticketType: tt, soldOfType: sold, editionRemaining: live.remaining });
          return (
            <li key={tt.id} data-testid={`ticket-type-${tt.id}`} className="paper-edge flex flex-col bg-bond-cream p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <h3 className="display-serif text-heading">
                  <Pending text={tt.name} />
                </h3>
                {exhausted && <span className="label-caps rounded-sm bg-bond-night px-2 py-1 text-bond-butter">Agotada</span>}
              </div>
              <p className="mt-3 text-sm text-bond-olive">
                <Pending text={tt.description} />
              </p>
              <ol aria-label={`Etapas de precio de ${tt.name}`} className="mt-6 divide-y divide-bond-night/15 border-y border-bond-night/15">
                {stages.map(({ stage, status }) => (
                  <StageRow key={stage.key} stage={stage} status={status} />
                ))}
              </ol>
              <QuantityStepper
                tt={tt}
                value={Math.min(quantities[tt.id] ?? 0, max)}
                max={max}
                disabled={!ready || exhausted}
                onChange={(next) => useSelectionStore.getState().setQuantity(tt.id, next)}
              />
              {left !== null && left > 0 && left <= tt.maxPerOrder && (
                <p className="mt-3 text-sm font-medium text-bond-night">
                  {left === 1 ? "Queda 1 cupo en esta etapa." : `Quedan ${left} cupos en esta etapa.`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-16">
        <CouponBox editionId={editionId} subtotalCents={subtotalCents} disabled={!ready} />
        <div>
          <OrderSummary data={summary} id="resumen-seleccion" />
          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              data-testid="reserva-error"
              className="mt-4 flex items-start gap-2 border border-bond-ember bg-bond-cream p-4 text-sm font-medium text-bond-night"
            >
              <ErrorIcon />
              <span>{error}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => void reserve()}
            disabled={!ready || count === 0 || reserving}
            aria-describedby="continuar-aviso"
            data-testid="continuar"
            className={`${buttonBase} ${buttonTones.night} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {reserving ? "Reservando tu lugar…" : "Continuar"}
            {!reserving && <span aria-hidden>→</span>}
          </button>
          <p id="continuar-aviso" className="mt-3 text-sm text-bond-olive">
            {count === 0
              ? "Elige al menos una entrada para continuar."
              : "Al continuar reservamos tu lugar por 10:00 minutos. Aún no se cobra nada."}
          </p>
        </div>
      </div>
    </div>
  );
}
