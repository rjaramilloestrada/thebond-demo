import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import { Accent, Section } from "./Section";

/** Galería editorial de la ed. 001: 6 placeholders en columnas con reveal. */
export function Gallery({ assets }: { assets: string[] }) {
  if (assets.length === 0) return null;
  return (
    <Section id="galeria" tone="sand" label="Archivo" title={["La", <Accent key="a" tone="sand">galería</Accent>]}>
      <ul className="columns-2 gap-3 md:columns-3 md:gap-6">
        {assets.map((asset, i) => (
          <li key={asset} className="mb-3 break-inside-avoid md:mb-6">
            <RevealImage delay={(i % 3) * 0.08}>
              <div className="paper-edge overflow-hidden">
                <PlaceholderImage
                  asset={asset}
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 32vw, 48vw"
                  className="h-auto w-full object-cover"
                />
              </div>
            </RevealImage>
          </li>
        ))}
      </ul>
    </Section>
  );
}
