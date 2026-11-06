import { Pending } from "@/components/Pending";
import type { FaqItem } from "@/domain/types";
import { Accent, Section } from "./Section";

/** FAQ y políticas con `<details>` nativo (teclado y lectoras de pantalla sin JS). */
export function Faq({ faq }: { faq: FaqItem[] }) {
  if (faq.length === 0) return null;
  return (
    <Section id="faq" tone="cream" label="FAQ y políticas" title={["Preguntas", <Accent key="a" tone="cream">frecuentes</Accent>]}>
      <div className="max-w-4xl border-t border-bond-night/25">
        {faq.map((item) => (
          <details key={item.id} className="border-b border-bond-night/25">
            <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-5 font-display text-2xl leading-tight md:text-4xl">
              {item.question}
              <span
                aria-hidden
                className="details-plus inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-bond-night font-sans text-2xl font-normal leading-none transition-transform duration-[var(--dur-base)] ease-[var(--bond-ease)]"
              >
                +
              </span>
            </summary>
            <div className="max-w-2xl pb-8 text-lead text-bond-night">
              <Pending text={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}
