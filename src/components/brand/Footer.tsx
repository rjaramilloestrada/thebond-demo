import Link from "next/link";
import { nextEdition, pastEditions } from "@/domain/selectors";
import { seed } from "@/seed/seed";
import { Logo } from "./Logo";

/** Pie mínimo: logo, unos enlaces y el crédito de IGNIS. Es lo único (con la confirmación) que va sobre night. */
export function Footer() {
  const { editions } = seed();
  const next = nextEdition(editions);
  const past = pastEditions(editions)[0];
  const linkClass =
    "label-caps inline-flex min-h-11 items-center text-bond-cream underline-offset-8 transition-colors duration-[var(--dur-fast)] hover:text-bond-butter hover:underline";
  return (
    <footer className="surface-dark bg-bond-night text-bond-cream print:hidden">
      <div className="container-editorial flex flex-col items-center gap-10 py-16 md:py-24">
        <Logo width={168} className="text-bond-cream" />
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
            {next && (
              <li>
                <Link href={`/ediciones/${next.slug}`} className={linkClass}>
                  Próxima edición
                </Link>
              </li>
            )}
            {past && (
              <li>
                <Link href={`/ediciones/${past.slug}`} className={linkClass}>
                  Archivo
                </Link>
              </li>
            )}
            <li>
              <Link href="/tokens" className={linkClass}>
                Sistema visual
              </Link>
            </li>
          </ul>
        </nav>
        <small className="text-xs text-bond-sand">Desarrollado por IGNIS</small>
      </div>
    </footer>
  );
}
