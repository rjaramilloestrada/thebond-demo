/**
 * Único punto donde se elige la implementación de cada adapter.
 * En el demo son todos `Mock*Adapter`. Para pasar a producción, se cambia aquí.
 * Las pantallas importan SOLO desde este archivo.
 */
import { MockEmailAdapter } from "./mock/mock-email-adapter";
import { MockInvoiceAdapter } from "./mock/mock-invoice-adapter";
import { MockPaymentAdapter } from "./mock/mock-payment-adapter";
import { MockStorageAdapter } from "./mock/mock-storage-adapter";
import type { EmailAdapter, InvoiceAdapter, PaymentAdapter, StorageAdapter } from "./types";

export const payments: PaymentAdapter = new MockPaymentAdapter();
export const emails: EmailAdapter = new MockEmailAdapter();
export const invoices: InvoiceAdapter = new MockInvoiceAdapter();
export const storage: StorageAdapter = new MockStorageAdapter();

export type * from "./types";
