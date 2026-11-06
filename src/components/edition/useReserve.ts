"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { reserve } from "@/services/checkout-service";
import { useSelectionStore } from "@/store/selection-store";

/**
 * Reserva los cupos de la selección en curso y lleva a los datos
 * (`/comprar/[orderId]`). La usan el selector y la barra fija móvil. Si no hay
 * cupo, deja el mensaje en el store para que el selector lo muestre.
 */
export function useReserve(editionId: string): () => Promise<void> {
  const router = useRouter();
  return useCallback(async () => {
    const state = useSelectionStore.getState();
    if (state.reserving) return;
    state.setReserving(true);
    state.setError(null);
    const result = await reserve({
      editionId,
      selection: state.quantities,
      couponCode: state.coupon?.code ?? null,
    });
    if (result.ok) {
      router.push(`/comprar/${result.order.id}`);
      return;
    }
    const after = useSelectionStore.getState();
    after.setError(result.message);
    after.setReserving(false);
  }, [editionId, router]);
}
