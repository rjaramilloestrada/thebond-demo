"use client";

import { create } from "zustand";
import type { Selection } from "@/domain/checkout";
import type { Coupon, ID } from "@/domain/types";

/**
 * Selección en curso de la página de edición (cantidades y cupón aplicado).
 * Se comparte entre el selector y la barra fija móvil. Vive solo en memoria: la
 * reserva (orden `reserved`) es lo que se persiste, y se crea con el servicio de
 * compra.
 */
interface SelectionState {
  editionId: ID | null;
  quantities: Selection;
  coupon: Coupon | null;
  error: string | null;
  reserving: boolean;
  init(editionId: ID): void;
  setQuantity(ticketTypeId: ID, quantity: number): void;
  setCoupon(coupon: Coupon | null): void;
  setError(error: string | null): void;
  setReserving(reserving: boolean): void;
  reset(): void;
}

const EMPTY = { quantities: {} as Selection, coupon: null, error: null, reserving: false };

export const useSelectionStore = create<SelectionState>()((set) => ({
  editionId: null,
  ...EMPTY,
  init: (editionId) => set((s) => (s.editionId === editionId ? s : { editionId, ...EMPTY })),
  setQuantity: (ticketTypeId, quantity) =>
    set((s) => ({ quantities: { ...s.quantities, [ticketTypeId]: Math.max(0, quantity) }, error: null })),
  setCoupon: (coupon) => set({ coupon, error: null }),
  setError: (error) => set({ error }),
  setReserving: (reserving) => set({ reserving }),
  reset: () => set({ ...EMPTY }),
}));

export function selectionTotal(quantities: Selection): number {
  return Object.values(quantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
}
