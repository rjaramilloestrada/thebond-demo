import { Pending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { RevealImage } from "@/components/Reveal";
import type { Speaker } from "@/domain/types";
import { Accent, Section } from "./Section";

/** Speakers y coaches: tarjetas escalonadas con reveal al hacer scroll. */
export function Speakers({ speakers }: { speakers: Speaker[] }) {
  if (speakers.length === 0) return null;
  return (
    <Section
      id="speakers"
      tone="cream"
      label="Quiénes guían"
      title={["Speakers y", <Accent key="a" tone="cream">coaches</Accent>]}
    >
      <ul className="flex flex-col gap-14 md:grid md:grid-cols-3 md:gap-10 lg:gap-16">
        {speakers.map((sp, i) => (
          <li
            key={sp.id}
            className={`w-[82%] md:w-auto ${i % 2 === 0 ? "self-start" : "self-end"} ${i === 1 ? "md:mt-20" : ""} ${i === 2 ? "md:mt-8" : ""}`}
          >
            <RevealImage delay={i * 0.08}>
              <div className="paper-edge overflow-hidden">
                <PlaceholderImage
                  asset={sp.photoAsset}
                  sizes="(min-width: 768px) 30vw, 82vw"
                  className="aspect-[4/5] h-auto w-full object-cover"
                />
              </div>
            </RevealImage>
            <h3 className="mt-5 font-display text-2xl leading-tight md:text-3xl">
              <Pending text={sp.name} />
            </h3>
            <p className="mt-2 text-sm text-bond-olive">
              <Pending text={sp.role} />
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
