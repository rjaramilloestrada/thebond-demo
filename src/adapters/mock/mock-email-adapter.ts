import type { EmailTemplate } from "@/domain/types";
import { useDbStore } from "@/store/db-store";
import type { EmailAdapter, EmailData } from "../types";
import { simulateLatency } from "./latency";

const SUBJECTS: Record<EmailTemplate, string> = {
  ticket: "Tu entrada a THE BOND",
  reminder: "Tu bond es mañana",
  "waitlist-available": "Se liberó un cupo en THE BOND",
  refund: "Tu reembolso de THE BOND",
  transfer: "Te transfirieron una entrada a THE BOND",
};

let emailSeq = 0;

/** No envía nada: guarda el registro del correo para mostrarlo como vista previa. */
export class MockEmailAdapter implements EmailAdapter {
  async send(template: EmailTemplate, to: string, data: EmailData): Promise<void> {
    await simulateLatency();
    emailSeq += 1;
    useDbStore.getState().put("emails", {
      id: `em-${Date.now().toString(36)}-${emailSeq}`,
      template,
      to,
      subject: SUBJECTS[template],
      orderId: data.orderId ?? null,
      ticketId: data.ticketId ?? null,
      sentAt: new Date().toISOString(),
    });
  }
}
