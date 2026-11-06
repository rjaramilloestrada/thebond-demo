import Link from "next/link";
import { EditionMeta } from "@/components/edition/EditionMeta";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import { titleParts } from "@/components/edition/title";
import type { Edition } from "@/domain/types";
import { editionHref } from "@/lib/routes";

/** Archivo de ediciones pasadas: una tarjeta por edición, con el sello "All spots taken". */
export function Archive({ editions }: { editions: Edition[] }) {
  if (editions.length === 0) return null;
  return (
    <section id="archivo" aria-label="Archivo de ediciones" className="bg-bond-cream text-bond-night">
      <div className="container-editorial py-20 md:py-36">
        <ul className="grid gap-16 md:grid-cols-12">
          {editions.map((e, i) => {
            const { lead, words } = titleParts(e.title);
            return (
              <li key={e.id} className={`md:col-span-7 ${i % 2 === 1 ? "md:col-start-6" : ""}`}>
                <Link href={editionHref(e.slug)} className="group block">
                  <RevealImage>
                    <div className="relative overflow-hidden rounded-sm">
                      <PlaceholderImage
                        asset={e.heroAsset}
                        sizes="(min-width: 1280px) 700px, (min-width: 768px) 58vw, 92vw"
                        className="aspect-[4/5] h-auto w-full object-cover transition-transform duration-[1200ms] ease-[var(--bond-ease)] group-hover:scale-[1.02] md:aspect-[5/4]"
                      />
                      {e.soldOut && (
                        <span className="label-caps absolute bottom-5 left-5 inline-flex rounded-full border border-bond-cream/80 bg-bond-night/55 px-4 py-2 text-bond-cream backdrop-blur-[2px]">
                          All spots taken
                        </span>
                      )}
                    </div>
                  </RevealImage>
                  <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                    <h2 className="display-serif text-display-m">
                      <span className="accent-italic text-bond-ember">{e.number} —</span> {lead} {words.join(" ")}
                    </h2>
                    <EditionMeta edition={e} fields={["date"]} className="text-bond-olive" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
