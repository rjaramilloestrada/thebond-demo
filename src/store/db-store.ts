"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Entities, EntityKey, ID } from "@/domain/types";
import { SEED_VERSION, seed, type SeedData } from "@/seed/seed";
import { safeStorage } from "./safe-storage";

/**
 * Store de datos del demo: entidades normalizadas por id, persistidas en
 * localStorage (con respaldo en memoria si el navegador lo bloquea).
 *
 * Las pantallas NO deben escribir aquí directamente para operaciones de
 * negocio: usan los adapters (`@/adapters`). El store es un detalle del
 * `MockStorageAdapter`.
 *
 * Hidratación: `skipHydration` evita el desajuste servidor/cliente. El
 * componente <StoreHydrator /> llama `rehydrate()` tras el primer render y
 * `hasHydrated` pasa a true. Antes de eso el store muestra los datos semilla.
 */

const DATA_KEYS: EntityKey[] = [
  "editions",
  "brands",
  "ticketTypes",
  "orders",
  "tickets",
  "coupons",
  "waitlist",
  "attendeeFields",
  "checkIns",
  "invoices",
  "emails",
];

export interface DbActions {
  put<K extends EntityKey>(key: K, item: Entities[K]): void;
  remove(key: EntityKey, id: ID): void;
  /** "Reiniciar demo": restaura los datos semilla */
  resetDemo(): void;
}

export type DbStore = SeedData & DbActions & { hasHydrated: boolean };

function pickData(state: SeedData): SeedData {
  const out = {} as Record<string, unknown>;
  for (const key of DATA_KEYS) out[key] = state[key];
  return out as unknown as SeedData;
}

export const useDbStore = create<DbStore>()(
  persist(
    (set) => ({
      ...seed(),
      hasHydrated: false,
      put: (key, item) =>
        set((state) => ({ [key]: { ...state[key], [item.id]: item } }) as Partial<DbStore>),
      remove: (key, id) =>
        set((state) => {
          const next = { ...state[key] } as Record<ID, unknown>;
          delete next[id];
          return { [key]: next } as Partial<DbStore>;
        }),
      resetDemo: () => set({ ...seed() }),
    }),
    {
      name: "thebond-demo",
      version: SEED_VERSION,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => pickData(state),
      // Si cambia la versión del esquema, se vuelve a los datos semilla.
      migrate: (_persisted, version) => (version === SEED_VERSION ? (_persisted as SeedData) : seed()),
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<SeedData>;
        const merged = { ...current } as Record<string, unknown>;
        for (const key of DATA_KEYS) if (stored[key]) merged[key] = stored[key];
        return merged as unknown as DbStore;
      },
      onRehydrateStorage: () => () => {
        useDbStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export const dbStore = useDbStore;
