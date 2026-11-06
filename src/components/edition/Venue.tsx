import { Pending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import type { Edition } from "@/domain/types";
import { Accent, Section } from "./Section";

/**
 * Sede: placeholder `sede-onna` como "mapa estático" y dirección. No usa
 * ninguna API de mapas externa. [[PENDIENTE: foto o mapa estático de la sede]]
 */
export function Venue({ edition }: { edition: Edition }) {
  return (
    <Section id="sede" tone="moss" label="Dónde" title={["La", <Accent key="a" tone="moss">sede</Accent>]}>
      <div className="grid gap-12 md:grid-cols-12 md:items-end md:gap-10">
        <RevealImage className="md:col-span-7">
          <figure>
            <div className="paper-edge overflow-hidden">
              <PlaceholderImage
                asset="sede-onna"
                sizes="(min-width: 1280px) 700px, (min-width: 768px) 58vw, 92vw"
                alt="Mapa estático provisional de la sede"
                className="aspect-[3/2] h-auto w-full object-cover"
              />
            </div>
            <figcaption className="label-caps mt-4 text-bond-sand">Mapa estático · provisional</figcaption>
          </figure>
        </RevealImage>
        <div className="md:col-span-5">
          <h3 className="display-serif text-display-m text-bond-cream">
            <Pending text={edition.venueName} className="!text-lg md:!text-2xl" />
          </h3>
          <address className="mt-6 text-lead not-italic text-bond-cream">
            <Pending text={edition.venueAddress} />
          </address>
        </div>
      </div>
    </Section>
  );
}
