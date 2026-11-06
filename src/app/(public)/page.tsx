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

/**
 * Home (Quiet Bond): una pantalla oliva con el logo, la próxima edición, una
 * línea de manifiesto y el archivo. El pie lo pone el layout raíz.
 */
export default function HomePage() {
  const data = seed();
  const next = nextEdition(data.editions);
  const vm = next ? buildEditionViewModel(data, next.slug) : undefined;
  return (
    <main id="contenido">
      <HomeHero />
      {vm && <FeaturedEdition vm={vm} />}
      <Manifesto />
      <Archive editions={pastEditions(data.editions)} />
    </main>
  );
}
