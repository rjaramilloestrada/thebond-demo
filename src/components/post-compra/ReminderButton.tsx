"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { emailHref } from "@/lib/routes";
import { ensureReminder } from "@/services/ticket-service";

/**
 * "Ver recordatorio": el correo "Tu bond es mañana" lo enviaría un proceso
 * programado la víspera; en el demo se genera al pedir la vista previa
 * (`ensureReminder`) y se abre en `/correo?id=…`.
 */
export function ReminderButton({
  ticketId,
  className,
  testId = "ver-recordatorio",
  disabled = false,
}: {
  ticketId: string | undefined;
  className: string;
  testId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (!ticketId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const log = await ensureReminder(ticketId);
      if (log) router.push(emailHref(log.id));
      else setError("No se pudo preparar el recordatorio de esta entrada.");
    } catch {
      setError("No se pudo preparar el recordatorio. Intenta de nuevo.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        disabled={disabled || !ticketId || busy}
        aria-busy={busy || undefined}
        onClick={() => void open()}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {busy ? "Preparando…" : "Ver recordatorio"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      )}
    </>
  );
}
