import Link from "next/link";
import { Monogram } from "./Monogram";

export function Footer() {
  return (
    <footer className="surface-dark bg-bond-night text-bond-cream">
      <div className="container-editorial flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-6">
          <Monogram size={64} className="text-bond-butter" />
          <p className="display-serif text-heading max-w-md leading-tight">
            See you in the next <span className="accent-italic text-bond-butter">bond.</span>
          </p>
          <p className="label-caps text-bond-sand">The Bond · A wellness community</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-3 text-sm">
          <Link href="/" className="w-fit underline-offset-4 hover:underline">
            Inicio
          </Link>
          <Link href="/tokens" className="w-fit underline-offset-4 hover:underline">
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
