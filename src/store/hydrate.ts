"use client";

import { useSyncExternalStore } from "react";
import { useCheckoutDraftStore } from "./checkout-draft-store";
import { useDbStore } from "./db-store";
import { useDemoStore } from "./demo-store";

/** Rehidrata los stores desde localStorage (o memoria). Llamar una vez, en el cliente. */
export async function hydrateStores(): Promise<void> {
  await Promise.all([
    useDbStore.persist.rehydrate(),
    useDemoStore.persist.rehydrate(),
    useCheckoutDraftStore.persist.rehydrate(),
  ]);
}

const subscribe = (cb: () => void) => {
  const a = useDbStore.subscribe(cb);
  const b = useDemoStore.subscribe(cb);
  const c = useCheckoutDraftStore.subscribe(cb);
  return () => {
    a();
    b();
    c();
  };
};

/** true cuando los datos persistidos ya se aplicaron. En SSR siempre es false. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () =>
      useDbStore.getState().hasHydrated &&
      useDemoStore.getState().hasHydrated &&
      useCheckoutDraftStore.getState().hasHydrated,
    () => false,
  );
}
