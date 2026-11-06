"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { ErrorIcon, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { checkTransferTarget, type TransferErrors, type TransferTarget } from "@/domain/tickets";
import type { Ticket } from "@/domain/types";
import { entryHref } from "@/lib/routes";
import { transferTicket } from "@/services/ticket-service";

/**
 * Transferir la entrada (brief 6.3): nombre y correo de quien la recibe, con
 * confirmación en un modal propio. Al confirmar, `ticket-service` sube la versión
 * (el QR anterior deja de valer), registra los correos y devolvemos el QR nuevo.
 * `onStart` y `onDone` dejan que la página ignore el estado intermedio.
 */
export function TransferSection({
  ticket,
  onStart,
  onDone,
}: {
  ticket: Ticket;
  /** Se llama antes de escribir: la página deja de re-resolver el token viejo */
  onStart: () => void;
  /** `ok` = transferida; el nuevo QR ya está guardado */
  onDone: (result: { ok: boolean; toName?: string }) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<TransferErrors>({});
  const [confirming, setConfirming] = useState<TransferTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailure(null);
    const check = checkTransferTarget({ name, email }, ticket.attendee.email);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setConfirming(check.target);
  }

  async function confirm() {
    if (!confirming || busy) return;
    setBusy(true);
    onStart();
    const result = await transferTicket(ticket.id, ticket.version, confirming);
    if (result.ok) {
      onDone({ ok: true, toName: result.ticket.attendee.name });
      setConfirming(null);
      setBusy(false);
      router.replace(entryHref(result.token));
      return;
    }
    // La transferencia no se hizo: se cierra el modal y se muestra el motivo
    onDone({ ok: false });
    setBusy(false);
    setConfirming(null);
    if (result.errors) setErrors(result.errors);
    setFailure(result.message);
  }

  return (
    <section aria-labelledby="transferir-titulo" data-testid="transferir" className="paper-edge bg-bond-cream p-6 text-bond-night md:p-8">
      <h2 id="transferir-titulo" className="display-serif text-heading">
        Transferir <span className="accent-italic">esta entrada</span>
      </h2>
      <p className="mt-3 max-w-prose text-base text-bond-olive">
        ¿No puedes ir? Pásala a otra persona. Su QR será nuevo y el tuyo dejará de funcionar.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-6">
        <TextField
          id="transfer-name"
          label="Nombre de quien recibe"
          autoComplete="off"
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          id="transfer-email"
          label="Correo de quien recibe"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          error={errors.email}
          hint="Ahí le llega el correo con su QR."
          onChange={(e) => setEmail(e.target.value)}
        />
        {failure && (
          <p role="alert" data-testid="transfer-error" className="flex items-start gap-2 border border-bond-ember p-4 text-sm font-medium">
            <ErrorIcon />
            <span>{failure}</span>
          </p>
        )}
        <button type="submit" data-testid="transfer-enviar" className={`${buttonBase} ${buttonTones.night} w-full sm:w-fit`}>
          Transferir entrada
        </button>
      </form>

      <Modal
        open={Boolean(confirming)}
        onClose={() => {
          if (!busy) setConfirming(null);
        }}
        title={
          <>
            ¿Transferir <span className="accent-italic">esta entrada?</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              data-testid="transfer-confirmar"
              disabled={busy}
              onClick={() => void confirm()}
              className={`${buttonBase} ${buttonTones.night} w-full disabled:cursor-wait disabled:opacity-70`}
            >
              {busy ? "Transfiriendo…" : "Sí, transferir"}
            </button>
            <button
              type="button"
              data-autofocus
              data-testid="transfer-cancelar"
              disabled={busy}
              onClick={() => setConfirming(null)}
              className={`${buttonBase} ${buttonTones.outlineLight} w-full disabled:opacity-60`}
            >
              Cancelar
            </button>
          </>
        }
      >
        {confirming && (
          <div className="grid gap-3">
            <p data-testid="transfer-resumen">
              La entrada pasará a <strong className="font-semibold">{confirming.name}</strong> ({confirming.email}).
            </p>
            <p>Tu QR actual dejará de funcionar y {confirming.name} recibirá uno nuevo por correo. No se puede deshacer.</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
