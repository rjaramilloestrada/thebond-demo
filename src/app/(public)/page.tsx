import type { Metadata } from "next";
import { Archive } from "@/components/home/Archive";
import { FeaturedEdition } from "@/components/home/FeaturedEdition";
import { HomeHero } from "@/components/home/HomeHero";
import { Manifesto } from "@/components/home/Manifesto";
import { buildEditionViewModel, nextEdition, pastEditions } from "@/domain/selectors";
import { seed } from "@/seed/seed";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Home de la comunidad (brief 6.1, punto 1): manifiesto, próxima edición y archivo. */
export default function HomePage() {
  const data = seed();
  const next = nextEdition(data.editions);
  const vm = next ? buildEditionViewModel(data, next.slug) : undefined;
  return (
    <main id="contenido">
      <HomeHero nextSlug={next?.slug} />
      <Manifesto />
      {vm && <FeaturedEdition vm={vm} />}
      <Archive editions={pastEditions(data.editions)} />
    </main>
  );
}
