import { Pending } from "@/components/Pending";
import type { SummaryData } from "./summary";

/**
 * Resumen de la orden, plegado: una línea con las entradas y el total; el
 * desglose (renglones, subtotal y cupón) se abre a demanda. La única nota de
 * "ejemplo" vive aquí, discreta, junto al total.
 */
export function OrderSummary({ data, className = "", id }: { data: SummaryData; className?: string; id?: string }) {
  return (
    <section aria-label="Tu orden" id={id} className={`border-y border-bond-night/20 ${className}`}>
      <details>
        <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3">
          <span className="flex items-center gap-2">
            <span className="label-caps">
              {data.quantity} {data.quantity === 1 ? "entrada" : "entradas"}
            </span>
            <span aria-hidden className="details-plus text-lg leading-none transition-transform duration-[var(--dur-base)]">
              +
            </span>
          </span>
          <span className="flex items-baseline gap-3">
            <span className="label-caps text-bond-olive">Total</span>
            <span data-testid="summary-total" className="font-display text-3xl leading-none">
              {data.total}
            </span>
          </span>
        </summary>
        <ul className="divide-y divide-bond-night/10 border-t border-bond-night/10">
          {data.rows.map((row) => (
            <li key={row.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <span className="min-w-0">
                <Pending text={row.label} dash />
                {row.detail && <span className="ml-2 text-bond-olive">{row.detail}</span>}
              </span>
              <span className="shrink-0">{row.amount}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 pb-4 text-sm">
          <dt className="text-bond-olive">Subtotal</dt>
          <dd data-testid="summary-subtotal" className="text-right">
            {data.subtotal}
          </dd>
          {data.coupon && (
            <>
              <dt className="text-bond-olive">Cupón {data.coupon.code}</dt>
              <dd data-testid="summary-coupon" className="text-right">
                {data.coupon.text}
              </dd>
            </>
          )}
        </dl>
      </details>
      {data.isExample && <p className="pb-3 text-right text-xs text-bond-olive">Precios de ejemplo</p>}
    </section>
  );
}
