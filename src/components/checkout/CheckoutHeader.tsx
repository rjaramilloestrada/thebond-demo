import Link from "next/link";
import type { ReactNode } from "react";
import { Label } from "@/components/brand/Label";
import { Pending } from "@/components/Pending";
import type { Edition } from "@/domain/types";

const STEPS = ["Elegir", "Datos", "Pago"] as const;

/**
 * Cabecera oscura del checkout: pasos (1 elegir, 2 datos, 3 pago), titular y la
 * edición. Deja espacio arriba para el encabezado público, que es transparente.
 */
export function CheckoutHeader({
  current,
  title,
  edition,
}: {
  /** Paso actual: 1 elegir, 2 datos, 3 pago */
  current: 2 | 3;
  title: ReactNode;
  edition?: Edition;
}) {
  return (
    <header className="surface-dark grain relative isolate overflow-hidden bg-bond-night pb-10 pt-28 text-bond-cream md:pb-14 md:pt-36">
      <div className="sunset-sun opacity-60" aria-hidden style={{ ["--sun-x" as string]: "85%", ["--sun-y" as string]: "-10%" }} />
      <div className="container-editorial relative z-10">
        <ol aria-label="Pasos de la compra" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < current;
            const active = n === current;
            const inner = (
              <>
                <span aria-hidden>{done ? "✓" : n}</span> {label}
              </>
            );
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`label-caps ${active ? "border-b-2 border-bond-butter pb-1 text-bond-butter" : "pb-1 text-bond-sand"}`}
              >
                {done && edition ? (
                  <Link href={`/ediciones/${edition.slug}`} className="underline-offset-4 hover:underline">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
        <h1 className="display-serif mt-8 text-display-l">{title}</h1>
        {edition && (
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lead text-bond-cream">
            <Label className="text-bond-sand">Edición {edition.number}</Label>
            <span className="accent-italic text-2xl">{edition.title}</span>
            <span className="text-base text-bond-sand">
              <Pending text={edition.dateLabel} />
            </span>
          </p>
        )}
      </div>
    </header>
  );
}
