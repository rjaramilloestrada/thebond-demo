"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { storage } from "@/adapters";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useCheckoutDraftStore } from "@/store/checkout-draft-store";
import { useDemoStore } from "@/store/demo-store";

/**
 * Píldora "Demo" discreta, dentro del encabezado (nunca flota sobre el contenido).
 * Abre una hoja pequeña con "Demo · datos simulados", el interruptor
 * "Mostrar pendientes" (modo presentación) y "Reiniciar demo". El panel completo
 * del demo (tour e interruptores) llegará en la Fase 6 sobre este mismo botón.
 * El área táctil es de 44 px aunque la píldora se vea chica.
 */
export function DemoPill({ className = "" }: { className?: string }) {
  const router = useRouter();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const showPending = useDemoStore((s) => s.showPending);
  const setFlag = useDemoStore((s) => s.setFlag);

  async function reset() {
    setBusy(true);
    await storage.reset();
    useDemoStore.getState().resetFlags();
    useCheckoutDraftStore.setState({ drafts: {}, activeOrderByEdition: {} });
    setBusy(false);
    setOpen(false);
    // Las pantallas transaccionales apuntan a órdenes que ya no existen
    if (/^\/(comprar|entrada|correo|factura)/.test(window.location.pathname.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? "", ""))) {
      router.push("/");
    }
  }

  return (
    <>
      <button
        type="button"
        data-demo-pill
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center print:hidden ${className}`}
      >
        <span className="label-caps rounded-full border border-current/45 px-3 py-1 !text-[0.625rem] !tracking-[0.22em] transition-colors duration-[var(--dur-fast)] hover:border-current">
          Demo
        </span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Demo · datos simulados"
        actions={
          <>
            <button
              type="button"
              data-testid="demo-reiniciar"
              disabled={busy}
              onClick={() => void reset()}
              className={`${buttonBase} ${buttonTones.outlineLight} w-full disabled:opacity-60`}
            >
              {busy ? "Reiniciando…" : "Reiniciar demo"}
            </button>
            <button type="button" data-autofocus onClick={() => setOpen(false)} className={`${buttonBase} ${buttonTones.night} w-full`}>
              Cerrar
            </button>
          </>
        }
      >
        <p className="text-sm text-bond-olive">Nada se cobra ni se envía. Los precios son de ejemplo.</p>
        <div className="mt-6 flex items-center justify-between gap-6 border-t border-bond-night/20 pt-5">
          <span id={`${uid}-lbl`} className="min-w-0">
            <span className="block font-medium">Mostrar pendientes</span>
            <span className="block text-sm text-bond-olive">Resalta lo que falta confirmar.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showPending}
            aria-labelledby={`${uid}-lbl`}
            data-testid="demo-mostrar-pendientes"
            onClick={() => setFlag("showPending", !showPending)}
            className="inline-flex min-h-11 shrink-0 items-center"
          >
            <span
              aria-hidden
              className={`relative inline-block h-7 w-12 rounded-full border border-bond-night transition-colors duration-[var(--dur-base)] ${showPending ? "bg-bond-night" : "bg-transparent"}`}
            >
              <span
                className={`absolute top-0.5 size-[1.375rem] rounded-full transition-transform duration-[var(--dur-base)] ease-[var(--bond-ease)] ${
                  showPending ? "translate-x-[1.375rem] bg-bond-butter" : "translate-x-0.5 bg-bond-night"
                }`}
              />
            </span>
          </button>
        </div>
      </Modal>
    </>
  );
}
