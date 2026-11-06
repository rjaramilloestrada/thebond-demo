"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CheckoutDraft } from "@/domain/checkout";
import type { ID } from "@/domain/types";
import { safeStorage } from "./safe-storage";

/**
 * Borrador de datos del checkout, uno por `orderId`. Un pago rechazado o una
 * recarga no pierden lo escrito. Se limpia al pagar o al expirar (lo hace el
 * servicio de compra). También recuerda la reserva en curso de cada edición para
 * poder retomarla o reemplazarla.
 *
 * Es estado de interfaz (lo escribe la pantalla); las escrituras de negocio van
 * siempre por `@/services/checkout-service`.
 */
export interface CheckoutDraftState {
  drafts: Record<ID, CheckoutDraft>;
  /** editionId → orderId de la reserva en curso de este navegador */
  activeOrderByEdition: Record<ID, ID>;
  hasHydrated: boolean;
  setDraft(orderId: ID, draft: CheckoutDraft): void;
  clearDraft(orderId: ID): void;
  setActiveOrder(editionId: ID, orderId: ID): void;
  clearActiveOrder(editionId: ID, orderId?: ID): void;
}

export const useCheckoutDraftStore = create<CheckoutDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      activeOrderByEdition: {},
      hasHydrated: false,
      setDraft: (orderId, draft) => set((s) => ({ drafts: { ...s.drafts, [orderId]: draft } })),
      clearDraft: (orderId) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[orderId];
          return { drafts };
        }),
      setActiveOrder: (editionId, orderId) =>
        set((s) => ({ activeOrderByEdition: { ...s.activeOrderByEdition, [editionId]: orderId } })),
      clearActiveOrder: (editionId, orderId) =>
        set((s) => {
          if (orderId && s.activeOrderByEdition[editionId] !== orderId) return s;
          const next = { ...s.activeOrderByEdition };
          delete next[editionId];
          return { activeOrderByEdition: next };
        }),
    }),
    {
      name: "thebond-checkout-drafts",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({ drafts: s.drafts, activeOrderByEdition: s.activeOrderByEdition }),
      onRehydrateStorage: () => () => {
        useCheckoutDraftStore.setState({ hasHydrated: true });
      },
    },
  ),
);
