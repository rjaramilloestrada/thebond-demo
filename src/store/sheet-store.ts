"use client";

import { create } from "zustand";

/**
 * Estado de la hoja de compra de la edición (abierta o cerrada). Vive solo en
 * memoria: el CTA del hero, la barra fija y el enlace `#entradas` la abren; la
 * propia hoja la cierra. No es un dato de negocio.
 */
interface SheetState {
  open: boolean;
  openSheet(): void;
  closeSheet(): void;
}

export const useSheetStore = create<SheetState>()((set) => ({
  open: false,
  openSheet: () => set({ open: true }),
  closeSheet: () => set({ open: false }),
}));
