import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";

/** Galería de la ed. 001: placeholders limpios en columnas, con reveal suave. */
export function Gallery({ assets }: { assets: string[] }) {
  if (assets.length === 0) return null;
  return (
    <section id="galeria" aria-label="Galería" className="bg-bond-cream text-bond-night">
      <div className="container-editorial pb-24 md:pb-36">
        <ul className="columns-2 gap-3 md:columns-3 md:gap-6">
          {assets.map((asset, i) => (
            <li key={asset} className="mb-3 break-inside-avoid md:mb-6">
              <RevealImage delay={(i % 3) * 0.1}>
                <div className="overflow-hidden rounded-sm">
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
      </div>
    </section>
  );
}
