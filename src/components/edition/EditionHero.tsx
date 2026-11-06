import type { CSSProperties } from "react";
import { HeroLines } from "@/components/HeroLines";
import { Pending } from "@/components/Pending";
import type { EditionLive } from "@/domain/selectors";
import type { Edition } from "@/domain/types";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { EditionCta } from "./EditionCta";
import { SeatsCounter } from "./SeatsCounter";
import { titleParts } from "./title";

const delay = (ms: number) => ({ "--d": ms }) as CSSProperties;

function Details({ edition }: { edition: Edition }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-bond-cream/30 pt-6">
      <div>
        <dt className="label-caps text-bond-sand">Fecha</dt>
        <dd className="mt-2 text-base">
          <Pending text={edition.dateLabel} />
        </dd>
      </div>
      <div>
        <dt className="label-caps text-bond-sand">Sede</dt>
        <dd className="mt-2 text-base">
          <Pending text={edition.venueName} />
        </dd>
      </div>
    </dl>
  );
}

/** Frases del tagline de una edición pasada, una por línea: "All spots taken. The first of many. Stay close." */
function taglineLines(tagline: string): string[] {
  return tagline
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Hero sunset (wow 1) de una edición. El titular se anima con CSS puro, así que
 * se pinta en el primer render (LCP). Edición actual: contador y CTA. Pasada:
 * estado SOLD OUT y acceso a la lista de espera.
 */
export function EditionHero({ edition, live }: { edition: Edition; live: EditionLive }) {
  const { lead, words, size } = titleParts(edition.title);
  const titleSize = size === "xl" ? "text-display-xl" : "text-display-xl-long";
  const past = edition.isPast;
  return (
    <section
      aria-label={`${edition.title}, edición ${edition.number}`}
      className="surface-dark grain relative isolate -mt-[var(--demo-strip-h)] flex [--sun-x:55%] [--sun-y:24%] md:[--sun-x:66%] md:[--sun-y:40%] min-h-svh flex-col justify-end overflow-hidden bg-bond-night text-bond-cream"
    >
      <div className="sunset-sun" aria-hidden />
      <div className="hero-scrim absolute inset-0" aria-hidden />
      <div className="container-editorial relative z-10 pb-10 pt-36 md:pb-16 lg:pb-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="label-caps hero-fade text-bond-sand" style={delay(0)}>
              The Bond · Edición <span className="text-bond-butter">{edition.number}</span>
            </p>
            <HeroLines
              className={`display-serif ${titleSize} mt-6 text-bond-cream`}
              lines={[
                ...(lead ? [<span key="lead" className="accent-italic text-bond-butter">{lead}</span>] : []),
                ...words,
              ]}
            />
            {past ? (
              <p className="hero-fade mt-8 max-w-xl font-display text-2xl italic leading-snug text-bond-butter md:text-4xl" style={delay(250)}>
                {taglineLines(edition.tagline).slice(1).join(" ")}
              </p>
            ) : (
              <p className="label-caps hero-fade mt-8 flex items-center gap-4 text-bond-butter" style={delay(250)}>
                <span aria-hidden className="h-px w-12 bg-bond-butter" />
                {edition.tagline}
              </p>
            )}
          </div>

          <div className="hero-fade lg:col-span-4" style={delay(450)}>
            {past ? (
              <div className="grid gap-8">
                <p
                  className="display-serif inline-flex w-fit -rotate-3 items-center border-2 border-bond-butter px-5 py-3 text-2xl text-bond-butter md:text-3xl"
                >
                  {taglineLines(edition.tagline)[0]?.replace(/\.$/, "") ?? "All spots taken"}
                </p>
                <Details edition={edition} />
                <a href="#lista-de-espera" className={`${buttonBase} ${buttonTones.butter} w-full lg:w-fit`}>
                  Lista de espera <span aria-hidden>↓</span>
                </a>
              </div>
            ) : (
              <div className="grid gap-8">
                <Details edition={edition} />
                <SeatsCounter initial={live} className="min-h-[8.5rem]" />
                <EditionCta initial={live} href="#entradas" soldOutHref="#lista-de-espera" className="w-full lg:w-fit" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
