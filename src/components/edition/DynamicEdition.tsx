"use client";

import Link from "next/link";
import { useMemo } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { buildEditionViewModel, nextEdition } from "@/domain/selectors";
import { useDbStore } from "@/store/db-store";
import { useDemoStore } from "@/store/demo-store";
import { useHasHydrated } from "@/store/hydrate";
import { EditionPage } from "./EditionPage";

/**
 * Página de una edición que NO está en los datos semilla (por ejemplo, una
 * creada con el wizard del panel, Fase 5). Se resuelve en el cliente contra el
 * store persistido y reutiliza la misma vista que las ediciones semilla.
 */
export function DynamicEdition({ slug }: { slug: string }) {
  const hydrated = useHasHydrated();
  const editions = useDbStore((s) => s.editions);
  const brands = useDbStore((s) => s.brands);
  const ticketTypes = useDbStore((s) => s.ticketTypes);
  const orders = useDbStore((s) => s.orders);
  const forceSoldOut = useDemoStore((s) => s.forceSoldOut);

  const vm = useMemo(
    () => (hydrated ? buildEditionViewModel({ editions, brands, ticketTypes, orders }, slug, { forceSoldOut }) : undefined),
    [hydrated, editions, brands, ticketTypes, orders, slug, forceSoldOut],
  );

  if (!hydrated) {
    return <main id="contenido" aria-busy="true" className="min-h-svh bg-bond-night" />;
  }

  if (!vm) {
    return (
      <main id="contenido" className="surface-dark grain relative flex min-h-svh flex-col justify-center bg-bond-night text-bond-cream">
        <div className="container-editorial relative z-10 py-32">
          <h1 className="display-serif text-display-l">
            Edición no <span className="accent-italic text-bond-butter">encontrada</span>
          </h1>
          <p className="mt-6 max-w-md text-lead">No hay una edición publicada con esta dirección.</p>
          <Link href="/" className={`${buttonBase} ${buttonTones.butter} mt-10`}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const next = nextEdition(editions);
  return <EditionPage vm={vm} next={next && next.slug !== slug ? next : undefined} />;
}
