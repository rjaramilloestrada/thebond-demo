import Link from "next/link";
import { Label } from "@/components/brand/Label";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { editionLive, type EditionViewModel } from "@/domain/selectors";
import type { Edition } from "@/domain/types";
import { BrandMarquee } from "./BrandMarquee";
import { EditionHero } from "./EditionHero";
import { Faq } from "./Faq";
import { Gallery } from "./Gallery";
import { Includes } from "./Includes";
import { LiveSalesSimulator } from "./LiveSalesSimulator";
import { Schedule } from "./Schedule";
import { Accent, Section } from "./Section";
import { Speakers } from "./Speakers";
import { StickyCta } from "./StickyCta";
import { TicketSelector } from "./TicketSelector";
import { Venue } from "./Venue";
import { WaitlistForm } from "./WaitlistForm";

/** Edición actual (brief 6.1, punto 2). */
function CurrentEdition({ vm }: { vm: EditionViewModel }) {
  const { edition } = vm;
  const live = editionLive(vm);
  return (
    <>
      <main id="contenido">
        <EditionHero edition={edition} live={live} />
        <Includes includes={edition.includes} />
        <Section
          id="entradas"
          tone="cream"
          label="Entradas"
          title={["Elige tu", <Accent key="a" tone="cream">entrada</Accent>]}
        >
          <TicketSelector ticketTypes={vm.ticketTypes} editionId={edition.id} initial={live} />
        </Section>
        <Schedule schedule={edition.schedule} tone="sand" />
        <Speakers speakers={edition.speakers} />
        <BrandMarquee brands={vm.brands} idPrefix="bonding" />
        <Venue edition={edition} />
        <Faq faq={edition.faq} />
      </main>
      <StickyCta initial={live} editionId={edition.id} />
      <LiveSalesSimulator slug={edition.slug} />
    </>
  );
}

/** Edición pasada (brief 6.1, punto 3): sold out, archivo y lista de espera. */
function PastEdition({ vm, next }: { vm: EditionViewModel; next?: Edition }) {
  const { edition } = vm;
  const live = editionLive(vm);
  return (
    <main id="contenido">
      <EditionHero edition={edition} live={live} />
      <Schedule schedule={edition.schedule} tone="cream" />
      <BrandMarquee brands={vm.brands} idPrefix="bonding" />
      <Gallery assets={edition.galleryAssets} />
      <Section
        id="lista-de-espera"
        tone="olive"
        label="Lista de espera"
        title={["Avísame si se", <Accent key="a" tone="olive">libera un cupo</Accent>]}
      >
        <WaitlistForm editionId={edition.id} tone="dark" />
      </Section>
      {next && (
        <section aria-labelledby="proxima-titulo" className="bg-bond-cream text-bond-night">
          <div className="container-editorial py-24 md:py-40">
            <Label className="text-bond-olive">Próxima edición</Label>
            <h2 id="proxima-titulo" className="display-serif mt-5 text-display-l">
              <span className="accent-italic text-bond-ember">{next.number}</span> {next.title}
            </h2>
            <Link
              href={`/ediciones/${next.slug}`}
              className={`${buttonBase} ${buttonTones.night} mt-10 w-full sm:w-fit`}
            >
              See you in the next bond <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export function EditionPage({ vm, next }: { vm: EditionViewModel; next?: Edition }) {
  return vm.edition.isPast ? <PastEdition vm={vm} next={next} /> : <CurrentEdition vm={vm} />;
}
