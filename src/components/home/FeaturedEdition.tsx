import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage, RevealLines } from "@/components/Reveal";
import { EditionCta } from "@/components/edition/EditionCta";
import { EditionMeta } from "@/components/edition/EditionMeta";
import { titleParts } from "@/components/edition/title";
import { editionLive, type EditionViewModel } from "@/domain/selectors";

/**
 * Próxima edición: una imagen grande, "002 — The Power Hour", la fecha (o un
 * teaser) y UN solo CTA. Sin contador de cupos: eso vive en la página de la edición.
 */
export function FeaturedEdition({ vm }: { vm: EditionViewModel }) {
  const { edition } = vm;
  const live = editionLive(vm);
  const { lead, words } = titleParts(edition.title);
  return (
    <section id="proxima" aria-labelledby="proxima-titulo" className="scroll-mt-0 bg-bond-cream text-bond-night">
      <div className="container-editorial grid gap-10 py-20 md:grid-cols-12 md:items-end md:gap-16 md:py-36">
        <RevealImage className="md:col-span-7">
          <div className="overflow-hidden rounded-sm">
            <PlaceholderImage
              asset={edition.heroAsset}
              sizes="(min-width: 1280px) 700px, (min-width: 768px) 58vw, 92vw"
              width={1280}
              className="aspect-[4/5] h-auto w-full object-cover md:aspect-[5/6]"
            />
          </div>
        </RevealImage>
        <div className="md:col-span-5 md:pb-6">
          <RevealLines
            as="h2"
            id="proxima-titulo"
            className="display-serif text-display-l"
            lines={[
              <span key="n">
                <span className="accent-italic text-bond-ember">{edition.number} —</span>
                {lead ? ` ${lead}` : ""}
              </span>,
              words.join(" "),
            ]}
          />
          <EditionMeta edition={edition} fields={["date"]} tone="dark" className="mt-8 text-bond-olive" />
          <EditionCta
            initial={live}
            href={`/ediciones/${edition.slug}/#entradas`}
            soldOutHref={`/ediciones/${edition.slug}`}
            soldOutLabel="Ver edición"
            className="mt-10 w-full sm:w-fit"
          />
        </div>
      </div>
    </section>
  );
}
