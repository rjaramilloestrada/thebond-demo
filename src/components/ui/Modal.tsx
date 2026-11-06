"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Modal propio (sin diálogos nativos del navegador). Usa el elemento nativo `<dialog>` con
 * `showModal()`, que ya trae lo que pide la accesibilidad: foco atrapado dentro
 * (el resto de la página queda inerte), Esc para cerrar y `aria-modal`. Al
 * abrir, el foco va al elemento marcado con `data-autofocus` (o al primero) y al
 * cerrar vuelve a donde estaba.
 *
 * Sin animación de entrada con `prefers-reduced-motion` (solo un fade corto).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  tone = "light",
}: {
  open: boolean;
  /** Se llama con Esc. Quien lo usa decide qué significa cerrar. */
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const target = dialog.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const el = returnFocus.current;
    returnFocus.current = null;
    if (el && document.contains(el)) el.focus();
  }, [open]);

  const dark = tone === "dark";
  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-body`}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={`modal-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-md border p-0 shadow-2xl ${
        dark ? "surface-dark border-bond-cream/30 bg-bond-night text-bond-cream" : "border-bond-night bg-bond-cream text-bond-night"
      }`}
    >
      <div className="p-6 md:p-8">
        <h2 id={`${uid}-title`} className="display-serif text-heading">
          {title}
        </h2>
        <div id={`${uid}-body`} className="mt-4 text-base">
          {children}
        </div>
        <div className="mt-8 flex flex-col gap-3">{actions}</div>
      </div>
    </dialog>
  );
}
