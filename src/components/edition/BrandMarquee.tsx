import { Label } from "@/components/brand/Label";
import { Pending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealLines } from "@/components/Reveal";
import type { Brand } from "@/domain/types";
import { MarqueePause } from "./MarqueePause";

function BrandItem({ brand, extra }: { brand: Brand; extra: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-6 md:gap-8 ${extra ? "marquee-extra" : ""}`}>
      <span className="marquee-lead flex items-center gap-6 md:gap-8">
        <span className="whitespace-nowrap font-display text-4xl italic text-bond-butter md:text-6xl">Bonding with</span>
        <span aria-hidden className="text-3xl text-bond-ember md:text-5xl">
          ·
        </span>
      </span>
      <PlaceholderImage
        asset={brand.logoAsset}
        width={640}
        sizes="(min-width: 768px) 192px, 144px"
        alt=""
        className="paper-edge aspect-[3/2] h-auto w-36 shrink-0 object-cover md:w-48"
      />
      <div className="whitespace-nowrap">
        <p className="display-sans text-3xl text-bond-cream md:text-4xl">
          <Pending text={brand.name} />
        </p>
        <p className="mt-2 text-sm text-bond-cream">
          <Pending text={brand.handle} />
        </p>
      </div>
      <span aria-hidden className="text-3xl text-bond-ember md:text-5xl">
        ·
      </span>
    </div>
  );
}

/**
 * "Bonding with" (wow 5): marquee CSS infinito con el logo provisional y el
 * @usuario de cada marca aliada. Pausa en hover, en foco y con el botón. El
 * duplicado y el movimiento van `aria-hidden`; las lectoras de pantalla reciben
 * una lista. Con `prefers-reduced-motion` queda como lista estática.
 */
export function BrandMarquee({ brands, idPrefix = "marquee" }: { brands: Brand[]; idPrefix?: string }) {
  if (brands.length === 0) return null;
  const repeats = Math.max(1, Math.ceil(3 / brands.length));
  const group = (dup: boolean) => (
    <div className={`marquee-group ${dup ? "marquee-dup" : ""}`}>
      {Array.from({ length: repeats }).flatMap((_, r) =>
        brands.map((b) => <BrandItem key={`${r}-${b.id}`} brand={b} extra={r > 0} />),
      )}
    </div>
  );
  return (
    <section aria-labelledby={`${idPrefix}-titulo`} className="bonding-bg surface-dark relative overflow-hidden py-24 text-bond-cream md:py-40">
      <div className="container-editorial mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-20">
        <header>
          <Label className="text-bond-sand">Marcas aliadas</Label>
          <RevealLines
            as="h2"
            id={`${idPrefix}-titulo`}
            lines={["Bonding", <span key="a" className="accent-italic text-bond-butter">with</span>]}
            className="display-serif mt-5 text-display-l"
          />
        </header>
        <MarqueePause targetId={idPrefix} />
      </div>
      <div id={idPrefix} className="marquee" data-paused="false">
        <div className="marquee-track" aria-hidden="true">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <ul className="sr-only">
        {brands.map((b) => (
          <li key={b.id}>
            {b.name}, {b.handle}
          </li>
        ))}
      </ul>
    </section>
  );
}
