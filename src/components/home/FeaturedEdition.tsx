import { Label } from "@/components/brand/Label";
import { Pending } from "@/components/Pending";
import { RevealLines } from "@/components/Reveal";
import { EditionCta } from "@/components/edition/EditionCta";
import { SeatsCounter } from "@/components/edition/SeatsCounter";
import { titleParts } from "@/components/edition/title";
import { editionLive, type EditionViewModel } from "@/domain/selectors";

/** Próxima edición destacada: número, titular, fecha y sede, contador de cupos y CTA. */
export function FeaturedEdition({ vm }: { vm: EditionViewModel }) {
  const { edition } = vm;
  const live = editionLive(vm);
  const { lead, words } = titleParts(edition.title);
  return (
    <section id="proxima" aria-labelledby="proxima-titulo" className="scroll-mt-4 bg-bond-cream text-bond-night">
      <div className="container-editorial py-24 md:py-40">
        <Label className="text-bond-olive">Próxima edición</Label>
        <div className="mt-8 grid gap-14 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p aria-hidden className="font-display text-8xl italic leading-none text-bond-ember md:text-[10rem]">
              {edition.number}
            </p>
            <RevealLines
              as="h2"
              id="proxima-titulo"
              className="display-serif mt-4 text-display-l"
              lines={[
                ...(lead ? [<span key="l" className="accent-italic text-bond-ember">{lead}</span>] : []),
                ...words,
              ]}
            />
            <p className="label-caps mt-8 flex items-center gap-4 text-bond-olive">
              <span aria-hidden className="h-px w-12 bg-bond-olive" />
              {edition.tagline}
            </p>
          </div>

          <div className="surface-dark grain relative isolate overflow-hidden rounded-md bg-bond-night [--sun-x:60%] [--sun-y:16%] p-8 text-bond-cream md:p-10 lg:col-span-5">
            <div className="sunset-sun opacity-90" aria-hidden />
            <div className="hero-scrim absolute inset-0" aria-hidden />
            <div className="relative z-10 grid gap-8 pt-24">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-bond-cream/30 pt-6">
                <div>
                  <dt className="label-caps text-bond-sand">Fecha</dt>
                  <dd className="mt-2">
                    <Pending text={edition.dateLabel} />
                  </dd>
                </div>
                <div>
                  <dt className="label-caps text-bond-sand">Sede</dt>
                  <dd className="mt-2">
                    <Pending text={edition.venueName} />
                  </dd>
                </div>
              </dl>
              <SeatsCounter initial={live} className="min-h-[8.5rem]" />
              <EditionCta
                initial={live}
                href={`/ediciones/${edition.slug}#entradas`}
                soldOutHref={`/ediciones/${edition.slug}`}
                soldOutLabel="Ver edición"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
