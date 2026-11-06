import type { CSSProperties, ReactNode } from "react";
import { HeroLines } from "@/components/HeroLines";
import type { EditionLive } from "@/domain/selectors";
import type { Edition } from "@/domain/types";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { EditionMeta } from "./EditionMeta";
import { OpenSheetButton } from "./OpenSheetButton";
import { SeatsLine } from "./SeatsLine";
import { titleParts } from "./title";

const delay = (ms: number) => ({ "--d": ms }) as CSSProperties;

/** Frases del tagline de una edición pasada, una por línea: "All spots taken. The first of many. Stay close." */
function taglineLines(tagline: string): string[] {
  return tagline
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "All spots taken." → ["All spots", "taken." en itálica] */
function statementLines(statement: string): ReactNode[] {
  const words = statement.replace(/\.$/, "").split(" ");
  const last = words.pop() ?? "";
  return [...(words.length ? [words.join(" ")] : []), <span key="last" className="accent-italic">{last}.</span>];
}

/**
 * Hero de una edición. Actual: el atardecer (el único "momento" de la marca) con
 * el titular, "fecha · sede" (o un teaser), una línea de cupos y UN CTA. Pasada:
 * un hero oliva plano y callado, "All spots taken." Los titulares se animan con
 * CSS puro, así que se pintan en el primer render (LCP).
 */
export function EditionHero({ edition, live }: { edition: Edition; live: EditionLive }) {
  const { lead, words, size } = titleParts(edition.title);
  const titleSize = size === "xl" ? "text-display-xl" : "text-display-xl-long";

  if (edition.isPast) {
    const lines = taglineLines(edition.tagline);
    const statement = lines[0] ?? "All spots taken.";
    return (
      <section
        data-edition-hero
        aria-label={`${edition.title}, edición ${edition.number}`}
        className="surface-mid relative flex min-h-svh flex-col justify-end bg-bond-olive text-bond-cream"
      >
        <div className="container-editorial pb-16 pt-32 md:pb-24">
          <h1 className="label-caps hero-fade text-bond-cream" style={delay(0)}>
            {edition.number} — {edition.title}
          </h1>
          <HeroLines
            as="p"
            className="display-serif mt-8 text-display-xl text-bond-butter"
            lines={statementLines(statement)}
          />
          <p className="hero-fade mt-8 font-display text-2xl italic leading-snug text-bond-cream md:text-4xl" style={delay(400)}>
            {lines.slice(1).join(" ")}
          </p>
          <div className="hero-fade mt-10 flex flex-wrap items-center gap-x-10 gap-y-4" style={delay(700)}>
            <EditionMeta edition={edition} tone="light" className="text-bond-cream" />
            <a href="#lista-de-espera" className={`${buttonBase} ${buttonTones.cream} w-full sm:w-fit`}>
              Lista de espera <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-edition-hero
      aria-label={`${edition.title}, edición ${edition.number}`}
      className="surface-dark grain relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-bond-night text-bond-cream [--sun-x:55%] [--sun-y:24%] md:[--sun-x:66%] md:[--sun-y:40%]"
    >
      <div className="sunset-sun" aria-hidden />
      <div className="hero-scrim absolute inset-0" aria-hidden />
      <div className="container-editorial relative z-10 pb-14 pt-32 md:pb-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="label-caps hero-fade text-bond-sand" style={delay(0)}>
              {edition.number} — {edition.tagline}
            </p>
            <HeroLines
              className={`display-serif ${titleSize} mt-6 text-bond-cream`}
              lines={[
                ...(lead ? [<span key="lead" className="accent-italic text-bond-butter">{lead}</span>] : []),
                ...words,
              ]}
            />
          </div>
          <div className="hero-fade grid gap-6 lg:col-span-4 lg:justify-items-start" style={delay(500)}>
            <EditionMeta edition={edition} tone="light" className="text-bond-cream" />
            <SeatsLine initial={live} tone="dark" className="min-h-[2.75rem]" />
            <OpenSheetButton initial={live} tone="cream" className="w-full lg:w-fit" />
          </div>
        </div>
      </div>
    </section>
  );
}
