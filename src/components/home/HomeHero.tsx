import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { HeroLines } from "@/components/HeroLines";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";

/** Hero sunset del home (wow 1): el manifiesto "Move. Connect. Belong." con el monograma BO. */
export function HomeHero({ nextSlug }: { nextSlug?: string }) {
  return (
    <section
      aria-label="THE BOND, a wellness community"
      className="surface-dark grain relative isolate -mt-[var(--demo-strip-h)] flex [--sun-x:55%] [--sun-y:24%] md:[--sun-x:66%] md:[--sun-y:40%] min-h-svh flex-col justify-end overflow-hidden bg-bond-night text-bond-cream"
    >
      <div className="sunset-sun" aria-hidden />
      <div className="hero-scrim absolute inset-0" aria-hidden />
      {/* Silueta del monograma dentro del sol (brief 3.4) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[57%] top-[15%] z-[2] -translate-x-1/2 -translate-y-1/2 text-bond-night md:left-[72%] md:top-[36%]"
      >
        <Monogram size={170} title="" className="md:hidden" />
        <Monogram size={320} title="" className="hidden md:block" />
      </div>
      <div className="container-editorial relative z-10 pb-12 pt-36 md:pb-20">
        <p className="label-caps hero-fade text-bond-sand">A wellness community</p>
        <HeroLines
          className="display-serif mt-6 text-display-hero text-bond-cream"
          lines={["Move.", "Connect.", <span key="b" className="accent-italic text-bond-butter">Belong.</span>]}
        />
        <div className="hero-fade mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <p className="max-w-md text-lead text-bond-cream md:col-span-5">
            THE BOND es la wellness community de Guayaquil: ediciones numeradas para moverte, conectar y pertenecer.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row md:col-span-7 md:justify-end">
            {nextSlug && (
              <Link href={`/ediciones/${nextSlug}#entradas`} className={`${buttonBase} ${buttonTones.butter}`}>
                Get your ticket <span aria-hidden>→</span>
              </Link>
            )}
            <a href="#archivo" className={`${buttonBase} ${buttonTones.outlineDark}`}>
              Ver archivo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
