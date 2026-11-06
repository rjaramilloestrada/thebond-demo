import { Pending } from "@/components/Pending";
import type { SummaryData } from "./summary";

/**
 * Resumen de la orden: "Subtotal $XX", "Cupón BOND10 −10 %" y "Total $XX",
 * rotulado "ejemplo" cuando los montos lo son.
 */
export function OrderSummary({
  data,
  heading = "Tu orden",
  className = "",
  id,
}: {
  data: SummaryData;
  heading?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={`${id ?? "resumen"}-titulo`} className={`paper-edge bg-bond-cream p-6 ${className}`}>
      <h2 id={`${id ?? "resumen"}-titulo`} className="label-caps text-bond-olive">
        {heading}
      </h2>
      {data.rows.length === 0 ? (
        <p className="mt-4 text-sm text-bond-olive">Elige al menos una entrada para ver tu resumen.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-bond-night/15 border-y border-bond-night/15">
            {data.rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block text-base text-bond-night">
                    <Pending text={row.label} />
                  </span>
                  {row.detail && <span className="block text-sm text-bond-olive">{row.detail}</span>}
                </span>
                <span className="shrink-0 font-display text-xl text-bond-night">{row.amount}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-base">
            <dt className="text-bond-olive">Subtotal</dt>
            <dd data-testid="summary-subtotal" className="text-right text-bond-night">
              {data.subtotal}
            </dd>
            {data.coupon && (
              <>
                <dt className="text-bond-olive">Cupón {data.coupon.code}</dt>
                <dd data-testid="summary-coupon" className="text-right text-bond-night">
                  {data.coupon.text}
                </dd>
              </>
            )}
            <dt className="label-caps self-end pt-3 text-bond-night">Total</dt>
            <dd data-testid="summary-total" className="pt-3 text-right font-display text-3xl leading-none text-bond-night">
              {data.total}
            </dd>
          </dl>
          {data.isExample && (
            <p className="mt-3 text-right text-sm text-bond-olive">
              Montos de ejemplo: el precio real está por confirmar.
            </p>
          )}
        </>
      )}
    </section>
  );
}
