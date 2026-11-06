import Link from "next/link";
import { Pending } from "@/components/Pending";
import { Accent, Section } from "@/components/edition/Section";
import type { Edition } from "@/domain/types";

/** Archivo de ediciones pasadas: prueba social reutilizable. */
export function Archive({ editions }: { editions: Edition[] }) {
  if (editions.length === 0) return null;
  return (
    <Section id="archivo" tone="sand" label="Archivo" title={["Ediciones", <Accent key="a" tone="sand">pasadas</Accent>]}>
      <ul className="border-t border-bond-night/30">
        {editions.map((e) => (
          <li key={e.id} className="border-b border-bond-night/30">
            <Link
              href={`/ediciones/${e.slug}`}
              className="group grid items-center gap-6 py-8 transition-colors duration-[var(--dur-fast)] hover:bg-bond-cream/50 md:grid-cols-12 md:gap-8 md:py-12"
            >
              <span aria-hidden className="font-display text-7xl italic leading-none text-bond-moss md:col-span-2 md:text-8xl">
                {e.number}
              </span>
              <div className="md:col-span-6">
                <h3 className="display-serif text-display-m">{e.title}</h3>
                <p className="mt-3 text-base">
                  <Pending text={e.dateLabel} /> · <Pending text={e.venueName} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-4 md:justify-end">
                {e.soldOut && (
                  <span className="display-serif inline-flex -rotate-3 border-2 border-bond-night px-4 py-2 text-xl">
                    All spots taken
                  </span>
                )}
                <span className="label-caps inline-flex min-h-11 items-center">
                  Ver edición{" "}
                  <span aria-hidden className="ml-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
