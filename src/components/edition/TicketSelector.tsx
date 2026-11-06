"use client";

import { Pending } from "@/components/Pending";
import { buttonBase } from "@/components/ui/button-styles";
import { formatMoney, getStageStatuses } from "@/domain/pricing";
import type { EditionLive } from "@/domain/selectors";
import type { PriceStage, StageStatus, TicketType } from "@/domain/types";
import { useEditionLive } from "./useEditionLive";
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

/**
 * Selector de entradas (brief 6.2, paso 1). En la Fase 2 se ve completo pero no
 * funciona: cantidad, cupón y "Continuar" están deshabilitados; la Fase 3 los
 * activa. Marca la etapa actual, deja la siguiente en "Próximamente" y tacha las
 * agotadas. Si la edición está agotada muestra la lista de espera.
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
      <ul className="grid gap-6 md:grid-cols-2 md:gap-8">
        {ticketTypes.map((tt) => {
          const sold = live.soldByType[tt.id] ?? 0;
          const stages = getStageStatuses(tt.stages, sold);
          const exhausted = stages.every((s) => s.status === "past");
          const qtyId = `qty-${tt.id}`;
          return (
            <li key={tt.id} className="paper-edge flex flex-col bg-bond-cream p-6 md:p-8">
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
              <div className="mt-6 flex items-center justify-between gap-4">
                <label htmlFor={qtyId} className="label-caps text-bond-olive">
                  Cantidad
                  <span className="mt-1 block normal-case tracking-normal text-xs text-bond-olive">
                    Máx. {tt.maxPerOrder} por orden
                  </span>
                </label>
                <div className="inline-flex items-center border border-dashed border-bond-night">
                  <button type="button" disabled aria-label="Menos" className="size-11 cursor-not-allowed text-xl text-bond-night">
                    −
                  </button>
                  <output id={qtyId} className="w-8 text-center font-display text-xl text-bond-night">
                    0
                  </output>
                  <button type="button" disabled aria-label="Más" className="size-11 cursor-not-allowed text-xl text-bond-night">
                    +
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-md">
          <label htmlFor="cupon" className="label-caps text-bond-olive">
            Cupón
          </label>
          <input
            id="cupon"
            type="text"
            disabled
            placeholder="Código de cupón"
            className="mt-2 min-h-12 w-full cursor-not-allowed border-0 border-b-2 border-dashed border-bond-night bg-transparent px-0 py-2 text-lg text-bond-night placeholder:text-bond-olive"
          />
        </div>
        <div>
          <button
            type="button"
            disabled
            aria-describedby="continuar-aviso"
            className={`${buttonBase} w-full cursor-not-allowed border border-dashed border-bond-night text-bond-night md:w-auto`}
          >
            Continuar
          </button>
        </div>
      </div>
      <p id="continuar-aviso" className="mt-4 text-sm text-bond-night">
        <span className="rounded-sm bg-bond-butter px-2 py-1 font-medium">
          Disponible en la próxima fase del demo: la compra se activa ahí.
        </span>
      </p>
    </div>
  );
}
