"use client";

import { useMemo } from "react";
import { buildEditionViewModel, editionLive, type EditionLive } from "@/domain/selectors";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { useDemoStore } from "@/store/demo-store";

/**
 * Estado vivo de una edición para las islas cliente. Antes de hidratar devuelve
 * el valor semilla calculado en el servidor (sin saltos de layout); después lee
 * el store persistido y el interruptor `forceSoldOut` del panel de demo.
 */
export function useEditionLive(initial: EditionLive): EditionLive & { hydrated: boolean } {
  const hydrated = useHasHydrated();
  const editions = useDbStore((s) => s.editions);
  const brands = useDbStore((s) => s.brands);
  const ticketTypes = useDbStore((s) => s.ticketTypes);
  const orders = useDbStore((s) => s.orders);
  const forceSoldOut = useDemoStore((s) => s.forceSoldOut);

  return useMemo(() => {
    if (!hydrated) return { ...initial, hydrated };
    const vm = buildEditionViewModel({ editions, brands, ticketTypes, orders }, initial.slug, { forceSoldOut });
    return { ...(vm ? editionLive(vm) : initial), hydrated };
  }, [hydrated, editions, brands, ticketTypes, orders, forceSoldOut, initial]);
}
