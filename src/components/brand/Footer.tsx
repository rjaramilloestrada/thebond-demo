import Link from "next/link";
import { nextEdition, pastEditions } from "@/domain/selectors";
import { seed } from "@/seed/seed";
import { Logo } from "./Logo";

export function Footer() {
  const { editions } = seed();
  const next = nextEdition(editions);
  const past = pastEditions(editions);
  const linkClass = "inline-flex min-h-8 w-fit items-center underline-offset-4 hover:underline";
  return (
    <footer className="surface-dark bg-bond-night text-bond-cream print:hidden">
      <div className="container-editorial flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-6">
          <Logo width={224} className="text-bond-cream" />
          <p className="display-serif text-heading max-w-md leading-tight">
            See you in the next <span className="accent-italic text-bond-butter">bond.</span>
          </p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-1 text-sm">
          <Link href="/" className={linkClass}>
            Inicio
          </Link>
          {next && (
            <Link href={`/ediciones/${next.slug}`} className={linkClass}>
              Próxima edición
            </Link>
          )}
          {past.map((e) => (
            <Link key={e.id} href={`/ediciones/${e.slug}`} className={linkClass}>
              Edición {e.number}
            </Link>
          ))}
          <Link href="/tokens" className={linkClass}>
            Sistema visual
          </Link>
        </nav>
      </div>
      <div className="border-t border-bond-cream/15">
        <div className="container-editorial flex items-center justify-between py-5">
          <small className="text-xs text-bond-sand">Desarrollado por IGNIS</small>
        </div>
      </div>
    </footer>
  );
}
