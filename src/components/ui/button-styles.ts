/** Estilos de botón compartidos. Solo tokens de color; texto con contraste AA verificado. */
export const buttonBase =
  "group inline-flex min-h-14 items-center justify-center gap-3 rounded-sm px-8 py-4 label-caps !text-[0.8125rem] text-center transition-colors duration-[var(--dur-fast)] ease-[var(--bond-ease)]";

export const buttonTones = {
  /** Sobre fondos oscuros: butter sobre night 13.7 */
  butter: "bg-bond-butter text-bond-night hover:bg-bond-cream",
  /** Sobre fondos claros (acción principal): cream sobre olive 5.65 / cream sobre moss 6.0 al pasar el cursor */
  olive: "bg-bond-olive text-bond-cream hover:bg-bond-moss",
  /** Sobre olive o el atardecer del hero: night sobre cream 14.7 */
  cream: "bg-bond-cream text-bond-night hover:bg-bond-butter",
  /** Solo en el momento del ticket (confirmación): butter sobre night 13.7 / butter sobre moss 5.6 al pasar el cursor */
  night: "bg-bond-night text-bond-butter hover:bg-bond-moss",
  outlineDark: "border border-bond-cream/70 text-bond-cream hover:bg-bond-cream hover:text-bond-night",
  outlineLight: "border border-bond-night text-bond-night hover:bg-bond-night hover:text-bond-cream",
} as const;

export type ButtonTone = keyof typeof buttonTones;

/** Enlace discreto con subrayado (acciones secundarias). El color lo pone quien lo usa. */
export const quietLink =
  "label-caps inline-flex min-h-11 items-center underline underline-offset-[0.55em] decoration-[0.5px] transition-opacity duration-[var(--dur-fast)] hover:opacity-70";
