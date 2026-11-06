import { Pending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import type { Edition } from "@/domain/types";

/**
 * Sede: placeholder `sede-onna` como "mapa estático" y dirección. No usa ninguna
 * API de mapas externa. [[PENDIENTE: foto o mapa estático de la sede]]
 */
export function Venue({ edition }: { edition: Edition }) {
  return (
    <section id="sede" aria-label="Sede" className="bg-bond-cream text-bond-night">
      <div className="container-editorial grid gap-10 py-24 md:grid-cols-12 md:items-end md:gap-14 md:py-36">
        <RevealImage className="md:col-span-7">
          <div className="overflow-hidden rounded-sm">
            <PlaceholderImage
              asset="sede-onna"
              sizes="(min-width: 1280px) 700px, (min-width: 768px) 58vw, 92vw"
              className="aspect-[3/2] h-auto w-full object-cover"
            />
          </div>
        </RevealImage>
        <div className="md:col-span-5">
          <h3 className="display-serif text-display-m">
            <Pending text={edition.venueName} dash />
          </h3>
          <address className="mt-4 text-lg not-italic text-bond-olive">
            <Pending text={edition.venueAddress} />
          </address>
        </div>
      </div>
    </section>
  );
}
