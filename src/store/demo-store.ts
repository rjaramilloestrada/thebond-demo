"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "./safe-storage";

/**
 * Interruptores del panel de demo (brief 6.4 y 6.6). Solo existen en el demo:
 * forzar pago rechazado, forzar edición agotada, acelerar el temporizador de
 * reserva a 30 s y simular ventas en vivo.
 *
 * `showPending` es el modo presentación (decisión de Rafa, enmienda a la regla
 * 0.1 del brief): apagado (por defecto) los `[[PENDIENTE: …]]` no se ven (un
 * guion discreto o un teaser) y los placeholders de imagen salen limpios; encendido
 * se ven resaltados en todas partes y los placeholders con su rótulo.
 */
export interface DemoFlags {
  forcePaymentDecline: boolean;
  forceSoldOut: boolean;
  /** Temporizador de reserva de 30 s en lugar de 10:00 */
  fastReservationTimer: boolean;
  /** El contador de cupos baja solo */
  simulateLiveSales: boolean;
  /** Modo presentación: false oculta los pendientes; true los resalta */
  showPending: boolean;
}

export interface DemoActions {
  setFlag<K extends keyof DemoFlags>(key: K, value: DemoFlags[K]): void;
  resetFlags(): void;
}

export const DEFAULT_FLAGS: DemoFlags = {
  forcePaymentDecline: false,
  forceSoldOut: false,
  fastReservationTimer: false,
  simulateLiveSales: false,
  showPending: false,
};

/** Duración de la reserva de cupos en milisegundos (10:00 o 30 s si está acelerada) */
export const RESERVATION_MS = 10 * 60 * 1000;
export const RESERVATION_FAST_MS = 30 * 1000;

export type DemoStore = DemoFlags & DemoActions & { hasHydrated: boolean };

export const useDemoStore = create<DemoStore>()(
  persist(
    (set) => ({
      ...DEFAULT_FLAGS,
      hasHydrated: false,
      setFlag: (key, value) => set({ [key]: value } as Partial<DemoStore>),
      // "Reiniciar demo" no cambia cómo se está presentando: showPending se conserva
      resetFlags: () => set((s) => ({ ...DEFAULT_FLAGS, showPending: s.showPending })),
    }),
    {
      name: "thebond-demo-flags",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state): DemoFlags => ({
        forcePaymentDecline: state.forcePaymentDecline,
        forceSoldOut: state.forceSoldOut,
        fastReservationTimer: state.fastReservationTimer,
        simulateLiveSales: state.simulateLiveSales,
        showPending: state.showPending,
      }),
      onRehydrateStorage: () => () => {
        useDemoStore.setState({ hasHydrated: true });
      },
    },
  ),
);
