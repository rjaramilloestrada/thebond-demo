"use client";

import type { EditionLive } from "@/domain/selectors";
import { WaitlistForm } from "./WaitlistForm";
import { useEditionLive } from "./useEditionLive";

/** Lista de espera de una edición en venta: solo aparece si se agota (incluye el interruptor `forceSoldOut` del demo). */
export function SoldOutWaitlist({ editionId, initial }: { editionId: string; initial: EditionLive }) {
  const live = useEditionLive(initial);
  if (!live.soldOut) return null;
  return (
    <section id="lista-de-espera" aria-label="Lista de espera" className="surface-mid scroll-mt-4 bg-bond-olive text-bond-cream">
      <div className="container-editorial py-24 md:py-36">
        <p className="display-serif text-display-l">
          All spots <span className="accent-italic text-bond-butter">taken.</span>
        </p>
        <div className="mt-12">
          <WaitlistForm editionId={editionId} tone="dark" />
        </div>
      </div>
    </section>
  );
}
