/** Estilos de botón compartidos. Solo tokens de color; texto con contraste AA verificado. */
export const buttonBase =
  "group inline-flex min-h-14 items-center justify-center gap-3 rounded-sm px-8 py-4 label-caps !text-[0.8125rem] text-center transition-colors duration-[var(--dur-fast)] ease-[var(--bond-ease)]";

export const buttonTones = {
  /** Sobre fondos oscuros: butter sobre night 13.7 */
  butter: "bg-bond-butter text-bond-night hover:bg-bond-cream",
  /** Sobre fondos claros: butter sobre night 13.7 / butter sobre moss 5.6 al pasar el cursor */
  night: "bg-bond-night text-bond-butter hover:bg-bond-moss",
  outlineDark: "border border-bond-cream/70 text-bond-cream hover:bg-bond-cream hover:text-bond-night",
  outlineLight: "border border-bond-night text-bond-night hover:bg-bond-night hover:text-bond-cream",
} as const;

export type ButtonTone = keyof typeof buttonTones;
