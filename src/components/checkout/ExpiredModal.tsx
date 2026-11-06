"use client";

import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";

/**
 * Aviso de reserva vencida (brief 6.2, paso 2). Modal propio: no se cierra sin
 * decidir; "Volver a elegir" (y Esc) regresan a la edición, donde el contador de
 * cupos ya se recuperó.
 */
export function ExpiredModal({ open, onBack }: { open: boolean; onBack: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onBack}
      title={
        <>
          Tu reserva <span className="accent-italic">venció</span>
        </>
      }
      actions={
        <button type="button" data-autofocus data-testid="expired-back" onClick={onBack} className={`${buttonBase} ${buttonTones.night} w-full`}>
          Volver a elegir
        </button>
      }
    >
      <p data-testid="expired-text">Tu reserva venció y liberamos los cupos. Puedes volver a elegir tus entradas y reservar de nuevo.</p>
    </Modal>
  );
}
