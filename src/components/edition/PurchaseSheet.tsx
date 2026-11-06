"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlainText } from "@/components/Pending";
import { Pending } from "@/components/Pending";
import { formatClock, useNow } from "@/components/checkout/hooks";
import { buildSummary } from "@/components/checkout/summary";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { ErrorIcon } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { availableForCounts, previewLines, selectableMax } from "@/domain/checkout";
import { couponDiscountCents, formatMoney, getStageStatuses } from "@/domain/pricing";
import type { EditionLive } from "@/domain/selectors";
import type { StageStatus, TicketType } from "@/domain/types";
import { checkoutHref } from "@/lib/routes";
import { previewCoupon } from "@/services/checkout-service";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { useDbStore } from "@/store/db-store";
import { selectionTotal, useSelectionStore } from "@/store/selection-store";
import { useSheetStore } from "@/store/sheet-store";
import { useEditionLive } from "./useEditionLive";
import { useReserve } from "./useReserve";

const STATUS_COPY: Record<StageStatus, string> = {
  active: "Actual",
  upcoming: "Próximamente",
  past: "Agotada",
};

/** Retomar una reserva en curso de este navegador (una línea discreta). */
function ResumeLine({ editionId }: { editionId: string }) {
  const activeId = useCheckoutDraftStore((s) => s.activeOrderByEdition[editionId]);
  const order = useDbStore((s) => (activeId ? s.orders[activeId] : undefined));
  const now = useNow(1000, Boolean(order));
  if (!order || order.status !== "reserved" || !order.reservationExpiresAt) return null;
  const remaining = new Date(order.reservationExpiresAt).getTime() - now;
  if (remaining <= 0) return null;
  const qty = order.lines.reduce((sum, l) => sum + l.quantity, 0);
  return (
    <p className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-bond-night/15 pb-4 text-sm">
      <span>
        Reserva en curso · {qty} {qty === 1 ? "entrada" : "entradas"} · {formatClock(remaining)}
      </span>
      <Link href={checkoutHref(order.id)} className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
        Retomar mi compra
      </Link>
    </p>
  );
}

function TypeDescription({ text }: { text: string }) {
  const plain = usePlainText(text);
  if (!plain) return null;
  return (
    <p className="mt-1 text-sm text-bond-olive">
      <Pending text={text} />
    </p>
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
  const btn =
    "inline-flex size-11 items-center justify-center rounded-full border border-bond-night/40 text-xl leading-none text-bond-night transition-colors hover:bg-bond-night hover:text-bond-cream disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-bond-night";
  return (
    <div role="group" aria-label={`Cantidad de ${tt.name.replace(/\[\[PENDIENTE: ([^\]]*)\]\]/, "$1")}`} className="inline-flex items-center gap-1">
      <button type="button" aria-label="Menos" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btn}>
        −
      </button>
      <output aria-live="polite" data-testid={`qty-${tt.id}`} className="w-9 text-center font-display text-2xl tabular-nums">
        {value}
      </output>
      <button type="button" aria-label="Más" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </div>
  );
}

type CouponMessage = { kind: "ok" | "error"; text: string } | null;

/** "¿Tienes un código?" revela el campo de cupón (BOND10, error si no existe). */
function CouponDisclosure({ editionId, subtotalCents, disabled }: { editionId: string; subtotalCents: number; disabled: boolean }) {
  const coupon = useSelectionStore((s) => s.coupon);
  const setCoupon = useSelectionStore((s) => s.setCoupon);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<CouponMessage>(null);
  const [checking, setChecking] = useState(false);
  const visible = open || Boolean(coupon);

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
    <div className="pt-4">
      <button
        type="button"
        data-testid="cupon-toggle"
        aria-expanded={visible}
        aria-controls="cupon-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 decoration-[0.5px]"
      >
        ¿Tienes un código?
      </button>
      <div id="cupon-panel" hidden={!visible}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!coupon && !checking && !disabled) void apply();
          }}
          className="flex items-end gap-3"
        >
          <label htmlFor="cupon" className="sr-only">
            Código de cupón
          </label>
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
            placeholder="Código"
            aria-invalid={error ? true : undefined}
            aria-describedby="cupon-resultado"
            className={`min-h-12 w-full min-w-0 border-0 border-b bg-transparent px-0 py-2 text-lg uppercase placeholder:normal-case placeholder:text-bond-olive disabled:opacity-70 ${
              error ? "border-bond-ember" : "border-bond-night/60"
            }`}
          />
          {coupon ? (
            <button type="button" onClick={remove} className="inline-flex min-h-12 shrink-0 items-center px-2 text-sm underline underline-offset-4">
              Quitar
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || checking || !code.trim()}
              className="inline-flex min-h-12 shrink-0 items-center px-2 text-sm font-medium underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              {checking ? "Revisando…" : "Aplicar"}
            </button>
          )}
        </form>
        <p id="cupon-resultado" role="status" aria-live="polite" className="mt-1 min-h-6 text-sm font-medium">
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
    </div>
  );
}

/**
 * Hoja de compra (pantalla 1 del flujo, en la misma página de la edición): por
 * tipo de entrada, el precio de la etapa activa en grande, la siguiente etapa en
 * una línea (las tres se ven al abrirla) y un selector de cantidad; el cupón
 * queda detrás de "¿Tienes un código?"; al pie, el total y "Continuar", que
 * reserva los cupos y lleva a los datos. La abren el CTA del hero, la barra fija
 * y el enlace `#entradas`. Si la edición se agota, se cierra y queda la lista de espera.
 */
export function PurchaseSheet({
  ticketTypes,
  editionId,
  initial,
}: {
  ticketTypes: TicketType[];
  editionId: string;
  initial: EditionLive;
}) {
  const live = useEditionLive(initial);
  const open = useSheetStore((s) => s.open);
  const closeSheet = useSheetStore((s) => s.closeSheet);
  const quantities = useSelectionStore((s) => s.quantities);
  const coupon = useSelectionStore((s) => s.coupon);
  const error = useSelectionStore((s) => s.error);
  const reserving = useSelectionStore((s) => s.reserving);
  const reserve = useReserve(editionId);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const { init, reset } = useSelectionStore.getState();
    init(editionId);
    return () => {
      reset();
      useSheetStore.getState().closeSheet();
    };
  }, [editionId]);

  // Un enlace con #entradas (desde el home o Instagram) abre la hoja directamente
  const hash = useRef(false);
  useEffect(() => {
    if (hash.current || !live.hydrated || live.soldOut) return;
    hash.current = true;
    if (window.location.hash === "#entradas") useSheetStore.getState().openSheet();
  }, [live.hydrated, live.soldOut]);

  useEffect(() => {
    if (live.soldOut && open) closeSheet();
  }, [live.soldOut, open, closeSheet]);

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
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
  const summary = useMemo(
    () =>
      buildSummary({
        lines,
        ticketTypes,
        coupon,
        discountCents: coupon ? couponDiscountCents(coupon, subtotalCents) : 0,
      }),
    [lines, ticketTypes, coupon, subtotalCents],
  );
  const count = selectionTotal(quantities);
  const ready = live.hydrated;

  const footer = (
    <div>
      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          data-testid="reserva-error"
          className="mb-4 flex items-start gap-2 border border-bond-ember p-3 text-sm font-medium"
        >
          <ErrorIcon />
          <span>{error}</span>
        </p>
      )}
      <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1">
        {summary.coupon && (
          <>
            <dt className="text-sm text-bond-olive">Subtotal</dt>
            <dd data-testid="summary-subtotal" className="text-right text-sm">
              {summary.subtotal}
            </dd>
            <dt className="text-sm text-bond-olive">Cupón {summary.coupon.code}</dt>
            <dd data-testid="summary-coupon" className="text-right text-sm">
              {summary.coupon.text}
            </dd>
          </>
        )}
        <dt className="label-caps">Total</dt>
        <dd data-testid="summary-total" className="text-right font-display text-3xl leading-none">
          {summary.total}
        </dd>
      </dl>
      {summary.isExample && count > 0 && <p className="mt-1 text-right text-xs text-bond-olive">Precios de ejemplo</p>}
      <button
        type="button"
        onClick={() => void reserve()}
        disabled={!ready || count === 0 || reserving}
        aria-describedby="continuar-aviso"
        data-testid="continuar"
        className={`${buttonBase} ${buttonTones.olive} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {reserving ? "Reservando tu lugar…" : "Continuar"}
        {!reserving && <span aria-hidden>→</span>}
      </button>
      <p id="continuar-aviso" className="mt-3 text-center text-xs text-bond-olive">
        {count === 0 ? "Elige al menos una entrada." : "Reservamos tu lugar por 10:00 min. Aún no se cobra."}
      </p>
    </div>
  );

  return (
    <Sheet open={open && !live.soldOut} onClose={closeSheet} title="Tu entrada" footer={footer} testId="purchase-sheet">
      <ResumeLine editionId={editionId} />
      <ul className="divide-y divide-bond-night/15">
        {ticketTypes.map((tt) => {
          const sold = live.soldByType[tt.id] ?? 0;
          const stages = getStageStatuses(tt.stages, sold);
          const exhausted = stages.every((s) => s.status === "past");
          const active = stages.find((s) => s.status === "active");
          const next = stages.find((s) => s.status === "upcoming");
          const max = maxByType[tt.id] ?? 0;
          const left = availableForCounts({ ticketType: tt, soldOfType: sold, editionRemaining: live.remaining });
          return (
            <li key={tt.id} data-testid={`ticket-type-${tt.id}`} className="py-6 first:pt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="display-serif text-heading">
                    <Pending text={tt.name} dash />
                  </h3>
                  <p className="label-caps mt-2 text-bond-olive">{exhausted ? "Agotada" : active?.stage.label}</p>
                  <TypeDescription text={tt.description} />
                </div>
                <p className="shrink-0 font-display text-4xl leading-none">
                  {active ? formatMoney(active.stage.amountCents, { isExample: active.stage.isExample }) : "—"}
                </p>
              </div>

              <details className="mt-3 text-sm text-bond-olive">
                <summary className="flex min-h-11 cursor-pointer items-center gap-2 underline-offset-4 hover:underline">
                  {next ? (
                    <span>
                      Luego {next.stage.label} · {formatMoney(next.stage.amountCents, { isExample: next.stage.isExample })}
                    </span>
                  ) : (
                    <span>Ver etapas</span>
                  )}
                  <span aria-hidden className="details-plus text-lg leading-none transition-transform duration-[var(--dur-base)]">
                    +
                  </span>
                </summary>
                <ol aria-label={`Etapas de precio de ${tt.name.replace(/\[\[PENDIENTE: ([^\]]*)\]\]/, "$1")}`} className="mb-2 mt-1 divide-y divide-bond-night/10">
                  {stages.map(({ stage, status }) => (
                    <li
                      key={stage.key}
                      aria-current={status === "active" ? "step" : undefined}
                      className={`flex items-baseline justify-between gap-4 py-2 ${status === "active" ? "font-medium text-bond-night" : ""} ${status === "past" ? "line-through" : ""}`}
                    >
                      <span>
                        {stage.label} <span className="ml-2 text-xs">{STATUS_COPY[status]}</span>
                      </span>
                      <span>{formatMoney(stage.amountCents, { isExample: stage.isExample })}</span>
                    </li>
                  ))}
                </ol>
              </details>

              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="text-sm text-bond-olive">
                  {left !== null && left > 0 && left <= tt.maxPerOrder
                    ? left === 1
                      ? "Queda 1 cupo."
                      : `Quedan ${left} cupos.`
                    : ""}
                </p>
                <QuantityStepper
                  tt={tt}
                  value={Math.min(quantities[tt.id] ?? 0, max)}
                  max={max}
                  disabled={!ready || exhausted}
                  onChange={(next) => useSelectionStore.getState().setQuantity(tt.id, next)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-bond-night/15">
        <CouponDisclosure editionId={editionId} subtotalCents={subtotalCents} disabled={!ready} />
      </div>
    </Sheet>
  );
}
