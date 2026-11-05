"use client";

import { useSyncExternalStore } from "react";
import { useDbStore } from "./db-store";
import { useDemoStore } from "./demo-store";

/** Rehidrata ambos stores desde localStorage (o memoria). Llamar una vez, en el cliente. */
export async function hydrateStores(): Promise<void> {
  await Promise.all([useDbStore.persist.rehydrate(), useDemoStore.persist.rehydrate()]);
}

const subscribe = (cb: () => void) => {
  const a = useDbStore.subscribe(cb);
  const b = useDemoStore.subscribe(cb);
  return () => {
    a();
    b();
  };
};

/** true cuando los datos persistidos ya se aplicaron. En SSR siempre es false. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useDbStore.getState().hasHydrated && useDemoStore.getState().hasHydrated,
    () => false,
  );
}
