import { Logo } from "@/components/brand/Logo";

/**
 * Pantalla completa en oliva plano con el logo oficial centrado y "Move. Connect.
 * Belong." debajo, como sus posts. Cubre todo el viewport (LCP). El logo y la
 * frase aparecen con un fundido lento (CSS puro).
 */
export function HomeHero() {
  return (
    <section
      aria-label="THE BOND, a wellness community"
      className="surface-mid relative flex min-h-svh flex-col items-center justify-center bg-bond-olive px-[var(--gutter)] text-bond-cream"
    >
      <h1 className="sr-only">THE BOND, a wellness community</h1>
      <div className="hero-fade w-[min(74vw,28rem)]" style={{ ["--d" as string]: 0 }}>
        <Logo title="" className="w-full text-bond-cream" />
      </div>
      <p className="label-caps hero-fade mt-10 text-center text-bond-cream md:mt-14" style={{ ["--d" as string]: 500 }}>
        Move. Connect. Belong.
      </p>
      <a
        href="#proxima"
        aria-label="Ver la próxima edición"
        className="hero-fade absolute inset-x-0 bottom-0 mx-auto flex h-20 w-11 items-end justify-center pb-4"
        style={{ ["--d" as string]: 1400 }}
      >
        <span aria-hidden className="block h-12 w-px bg-bond-cream/60" />
      </a>
    </section>
  );
}
