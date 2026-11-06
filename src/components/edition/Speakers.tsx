import { Pending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import type { Speaker } from "@/domain/types";

/** Speakers y coaches: retratos en una fila, con reveal suave al hacer scroll. */
export function Speakers({ speakers }: { speakers: Speaker[] }) {
  if (speakers.length === 0) return null;
  return (
    <section id="speakers" aria-label="Speakers y coaches" className="bg-bond-cream text-bond-night">
      <div className="container-editorial py-24 md:py-36">
        <ul className="grid gap-14 md:grid-cols-3 md:gap-10 lg:gap-16">
          {speakers.map((sp, i) => (
            <li key={sp.id}>
              <RevealImage delay={i * 0.1}>
                <div className="overflow-hidden rounded-sm">
                  <PlaceholderImage asset={sp.photoAsset} sizes="(min-width: 768px) 30vw, 92vw" className="aspect-[4/5] h-auto w-full object-cover" />
                </div>
              </RevealImage>
              <h3 className="mt-5 font-display text-2xl leading-tight">
                <Pending text={sp.name} dash />
              </h3>
              <p className="mt-1 text-sm text-bond-olive">
                <Pending text={sp.role} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
