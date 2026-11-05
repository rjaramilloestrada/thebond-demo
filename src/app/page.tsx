import Link from "next/link";
import { Label } from "@/components/brand/Label";
import { Monogram } from "@/components/brand/Monogram";
import { Pending } from "@/components/Pending";

/** Placeholder mínimo. El home real de la comunidad llega en la Fase 2. */
export default function HomePage() {
  return (
    <main className="surface-dark grain relative flex min-h-[80svh] flex-col justify-between overflow-hidden bg-bond-night text-bond-cream">
      <div className="sunset-sun opacity-70" aria-hidden />
      <div className="container-editorial relative z-10 flex items-center justify-between pt-8">
        <Monogram size={56} className="text-bond-butter" />
        <Label className="text-bond-sand">Demo del portal de entradas</Label>
      </div>
      <div className="container-editorial relative z-10 pb-16 pt-24">
        <h1 className="display-serif text-display-l">
          Move. Connect. <span className="accent-italic text-bond-butter">Belong.</span>
        </h1>
        <p className="mt-8 max-w-md text-lead text-bond-cream">
          El home de la comunidad llega en la Fase 2. <Pending text="[[PENDIENTE: home de la comunidad (Fase 2)]]" />
        </p>
        <Link
          href="/tokens"
          className="mt-10 inline-flex items-center gap-3 rounded-sm bg-bond-butter px-6 py-4 label-caps text-bond-night transition-colors duration-[var(--dur-fast)] hover:bg-bond-cream"
        >
          Ver sistema visual <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
