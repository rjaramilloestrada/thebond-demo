"use client";

import { Pending, Teaser, useShowPending } from "@/components/Pending";
import { hasData } from "@/lib/pending";
import type { FaqItem } from "@/domain/types";

/**
 * FAQ y políticas: tres acordeones cerrados con `<details>` nativo (teclado y
 * lectoras de pantalla sin JS). Mientras la respuesta sea un pendiente, se
 * ve el teaser "Policy reveal · soon".
 */
export function Faq({ faq }: { faq: FaqItem[] }) {
  const showPending = useShowPending();
  if (faq.length === 0) return null;
  return (
    <section id="faq" aria-label="Preguntas frecuentes" className="bg-bond-cream text-bond-night">
      <div className="container-editorial py-24 md:py-36">
        <div className="mx-auto max-w-3xl border-t border-bond-night/20">
          {faq.map((item) => (
            <details key={item.id} className="border-b border-bond-night/20">
              <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-4 font-display text-xl leading-tight md:text-2xl">
                {item.question}
                <span
                  aria-hidden
                  className="details-plus inline-flex size-8 shrink-0 items-center justify-center font-sans text-2xl font-light leading-none transition-transform duration-[var(--dur-base)] ease-[var(--bond-ease)]"
                >
                  +
                </span>
              </summary>
              <div className="max-w-xl pb-8 text-lg text-bond-night">
                {hasData(item.answer) || showPending ? <Pending text={item.answer} /> : <Teaser label="Policy reveal" />}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
