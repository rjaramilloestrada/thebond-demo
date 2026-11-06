import type { IncludeItem } from "@/domain/types";
import { Accent, Section } from "./Section";

/** "Your ticket includes": estructura real de la ed. 001 (brief 2 y 6.1). */
export function Includes({ includes }: { includes: IncludeItem[] }) {
  return (
    <Section id="incluye" tone="olive" label="Tu entrada" title={["Your ticket", <Accent key="a" tone="olive">includes</Accent>]}>
      <ol className="grid md:grid-cols-2 md:gap-x-16">
        {includes.map((inc, i) => (
          <li key={inc.id} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-bond-cream/30 py-8 md:py-12">
            <span aria-hidden className="font-display text-3xl italic leading-none text-bond-butter md:text-4xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="display-sans text-display-m text-bond-cream">{inc.title}</h3>
              <p className="mt-4 max-w-md text-lead text-bond-cream">{inc.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
