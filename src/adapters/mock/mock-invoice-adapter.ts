import { validateTaxId } from "@/domain/validation";
import { useDbStore } from "@/store/db-store";
import type { InvoiceAdapter, InvoiceResult } from "../types";
import { simulateLatency } from "./latency";

/**
 * Factura electrónica simulada. NO consulta al SRI ni tiene validez tributaria.
 * Devuelve la factura; quien la emite decide guardarla (a través de StorageAdapter).
 */
export class MockInvoiceAdapter implements InvoiceAdapter {
  async issue(
    order: Parameters<InvoiceAdapter["issue"]>[0],
    buyerTaxId: Parameters<InvoiceAdapter["issue"]>[1],
  ): Promise<InvoiceResult> {
    await simulateLatency();
    const check = validateTaxId(buyerTaxId.number);
    if (!check.valid) return { ok: false, message: check.message };

    const count = Object.keys(useDbStore.getState().invoices).length;
    return {
      ok: true,
      invoice: {
        id: `inv-${Date.now().toString(36)}-${count + 1}`,
        orderId: order.id,
        number: `DEMO-${String(count + 1).padStart(6, "0")}`,
        status: "authorized",
        issuedAt: new Date().toISOString(),
        buyerName: order.buyer.name,
        buyerTaxId: buyerTaxId.number,
        totalCents: order.totalCents,
        isExample: order.lines.some((l) => l.isExample),
      },
    };
  }
}
