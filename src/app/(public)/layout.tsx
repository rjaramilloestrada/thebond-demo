import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { SmoothScroll } from "@/components/SmoothScroll";
import { nextEdition } from "@/domain/selectors";
import { seed } from "@/seed/seed";

/** Layout del sitio público: encabezado mínimo sobre el hero, enlace de salto y scroll suave. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const next = nextEdition(seed().editions);
  const navLink =
    "inline-flex min-h-11 items-center label-caps text-bond-cream underline-offset-8 transition-colors duration-[var(--dur-fast)] hover:text-bond-butter hover:underline";
  return (
    <>
      <a
        href="#contenido"
        className="label-caps sr-only z-[60] rounded-sm bg-bond-butter px-4 py-3 text-bond-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <SmoothScroll />
      <header className="surface-dark absolute inset-x-0 top-0 z-30">
        <div className="container-editorial flex items-center justify-between py-4 md:py-6">
          <Link href="/" aria-label="THE BOND, inicio" className="inline-flex items-center gap-3 text-bond-butter">
            <Monogram size={44} className="shrink-0" />
            <span className="label-caps hidden text-bond-cream sm:inline">The Bond</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-5 sm:gap-8">
            {next && (
              <Link href={`/ediciones/${next.slug}`} className={navLink}>
                Próxima edición
              </Link>
            )}
            <Link href="/#archivo" className={navLink}>
              Archivo
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
