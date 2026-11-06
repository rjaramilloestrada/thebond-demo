"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Hoja modal: bottom sheet en móvil y panel lateral en escritorio, sobre el
 * elemento nativo `<dialog>` (`showModal()`: foco atrapado, Esc, `aria-modal`, el
 * resto de la página inerte). Además bloquea el scroll de la página mientras está
 * abierta y devuelve el foco a quien la abrió. La barra de arrastre es solo
 * visual. Entra y sale con un movimiento corto; con `prefers-reduced-motion` solo
 * hay un fundido. Lleva `data-lenis-prevent`: su contenido hace scroll nativo.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  testId,
}: {
  open: boolean;
  /** Se llama con Esc, con la X y al tocar el velo */
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Zona fija al pie (total y acción principal) */
  footer?: ReactNode;
  testId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const root = document.documentElement;
    if (open) {
      if (!dialog.open) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.removeAttribute("data-closing");
        dialog.showModal();
        root.style.overflow = "hidden";
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      }
      return;
    }
    if (!dialog.open) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dialog.setAttribute("data-closing", "true");
    const t = window.setTimeout(
      () => {
        dialog.close();
        dialog.removeAttribute("data-closing");
        root.style.overflow = "";
        const el = returnFocus.current;
        returnFocus.current = null;
        if (el && document.contains(el)) el.focus();
      },
      reduce ? 150 : 300,
    );
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    return () => {
      document.documentElement.style.overflow = "";
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      data-testid={testId}
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Un clic en el velo (::backdrop) llega con el propio <dialog> como destino
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet-dialog bg-bond-cream text-bond-night shadow-2xl"
    >
      <div className="flex min-h-0 flex-initial flex-col md:h-full md:flex-1">
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-bond-night/25 md:hidden" />
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-2 pt-4 md:px-8 md:pt-8">
          <h2 id={`${uid}-title`} className="display-serif text-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar"
            data-testid="sheet-cerrar"
            className="-mr-3 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-bond-night transition-colors duration-[var(--dur-fast)] hover:bg-bond-night/10"
          >
            <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="m4 4 12 12M16 4 4 16" />
            </svg>
          </button>
        </div>
        <div data-lenis-prevent className="min-h-0 flex-initial overflow-y-auto overscroll-contain px-6 pb-6 pt-2 md:flex-1 md:px-8">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-bond-night/15 bg-bond-cream px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-8">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
