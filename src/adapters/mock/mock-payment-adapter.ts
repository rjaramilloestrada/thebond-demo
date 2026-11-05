import { useDemoStore } from "@/store/demo-store";
import type { ChargeResult, PaymentAdapter, RefundResult } from "../types";
import { simulateLatency } from "./latency";

let chargeSeq = 0;

/** "Caja de pagos" simulada. Rechaza el cobro si el panel de demo lo fuerza. */
export class MockPaymentAdapter implements PaymentAdapter {
  async createCharge(order: Parameters<PaymentAdapter["createCharge"]>[0]): Promise<ChargeResult> {
    await simulateLatency();
    if (useDemoStore.getState().forcePaymentDecline) {
      return {
        ok: false,
        code: "declined",
        message: "La caja de pagos rechazó la tarjeta. Prueba con otra tarjeta o inténtalo de nuevo.",
      };
    }
    chargeSeq += 1;
    return {
      ok: true,
      chargeId: `demo_ch_${order.id}_${chargeSeq}`,
      approvedAt: new Date().toISOString(),
    };
  }

  async refund(orderId: string): Promise<RefundResult> {
    await simulateLatency();
    return { ok: true, refundId: `demo_rf_${orderId}`, refundedAt: new Date().toISOString() };
  }
}
