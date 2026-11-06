import Link from "next/link";
import { RevealLines } from "@/components/Reveal";
import { quietLink } from "@/components/ui/button-styles";
import { editionLive, type EditionViewModel } from "@/domain/selectors";
import type { Edition } from "@/domain/types";
import { editionHref } from "@/lib/routes";
import { BondingWith } from "./BondingWith";
import { EditionDetails } from "./EditionDetails";
import { EditionHero } from "./EditionHero";
import { Faq } from "./Faq";
import { Gallery } from "./Gallery";
import { Includes } from "./Includes";
import { LiveSalesSimulator } from "./LiveSalesSimulator";
import { PurchaseSheet } from "./PurchaseSheet";
import { SoldOutWaitlist } from "./SoldOutWaitlist";
import { StickyCta } from "./StickyCta";
import { WaitlistForm } from "./WaitlistForm";

/** Edición actual (brief 6.1, punto 2): hero, qué incluye, programa, marcas, FAQ; la compra va en una hoja. */
function CurrentEdition({ vm }: { vm: EditionViewModel }) {
  const { edition } = vm;
  const live = editionLive(vm);
  return (
    <>
      <main id="contenido">
        <EditionHero edition={edition} live={live} />
        <Includes includes={edition.includes} />
        <EditionDetails edition={edition} />
        <BondingWith brands={vm.brands} />
        <Faq faq={edition.faq} />
        <SoldOutWaitlist editionId={edition.id} initial={live} />
      </main>
      <PurchaseSheet ticketTypes={vm.ticketTypes} editionId={edition.id} initial={live} />
      <StickyCta initial={live} />
      <LiveSalesSimulator slug={edition.slug} />
    </>
  );
}

/** Edición pasada (brief 6.1, punto 3): hero callado "All spots taken.", cronograma real, galería y lista de espera. */
function PastEdition({ vm, next }: { vm: EditionViewModel; next?: Edition }) {
  const { edition } = vm;
  const live = editionLive(vm);
  return (
    <main id="contenido">
      <EditionHero edition={edition} live={live} />
      <EditionDetails edition={edition} showVenue={false} />
      <BondingWith brands={vm.brands} quietWhenEmpty />
      <Gallery assets={edition.galleryAssets} />
      <section id="lista-de-espera" aria-label="Lista de espera" className="surface-mid scroll-mt-4 bg-bond-olive text-bond-cream">
        <div className="container-editorial py-24 md:py-36">
          <RevealLines
            as="h2"
            className="display-serif text-display-l"
            lines={["Stay", <span key="a" className="accent-italic text-bond-butter">close.</span>]}
          />
          <div className="mt-12">
            <WaitlistForm editionId={edition.id} tone="dark" />
          </div>
        </div>
      </section>
      {next && (
        <section aria-label="Próxima edición" className="bg-bond-cream text-bond-night">
          <div className="container-editorial flex flex-wrap items-center justify-between gap-6 py-16 md:py-24">
            <p className="display-serif text-display-m">
              <span className="accent-italic text-bond-ember">{next.number} —</span> {next.title}
            </p>
            <Link href={editionHref(next.slug)} className={`${quietLink} text-bond-olive`}>
              See you in the next bond <span aria-hidden className="ml-3">→</span>
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
