import type { ReactNode } from "react";
import { Label } from "@/components/brand/Label";
import { RevealLines } from "@/components/Reveal";

export type Tone = "cream" | "sand" | "olive" | "moss" | "night";

/**
 * Pares de color verificados (WCAG AA para texto chico):
 * cream: night 14.7, olive 5.65 · sand: night 11.0, moss 4.5 · olive: cream 5.65, butter 5.27 (sand sobre olive da 4.23: no usar en texto chico)
 * moss: cream 6.0, butter 5.6 · night: cream 14.7, butter 13.7, sand 11.0.
 * El acento itálico va en ember solo sobre cream y solo en tamaño grande (≥ 24 px).
 */
export const TONES: Record<
  Tone,
  { bg: string; text: string; label: string; accent: string; rule: string; surface: string; muted: string }
> = {
  cream: {
    bg: "bg-bond-cream",
    text: "text-bond-night",
    label: "text-bond-olive",
    accent: "text-bond-ember",
    rule: "border-bond-night/20",
    surface: "",
    muted: "text-bond-olive",
  },
  sand: {
    bg: "bg-bond-sand",
    text: "text-bond-night",
    label: "text-bond-moss",
    accent: "text-bond-moss",
    rule: "border-bond-night/25",
    surface: "",
    muted: "text-bond-moss",
  },
  olive: {
    bg: "bg-bond-olive",
    text: "text-bond-cream",
    label: "text-bond-cream",
    accent: "text-bond-butter",
    rule: "border-bond-cream/30",
    surface: "surface-mid",
    muted: "text-bond-cream",
  },
  moss: {
    bg: "bg-bond-moss",
    text: "text-bond-cream",
    label: "text-bond-butter",
    accent: "text-bond-butter",
    rule: "border-bond-cream/25",
    surface: "surface-mid",
    muted: "text-bond-sand",
  },
  night: {
    bg: "bg-bond-night",
    text: "text-bond-cream",
    label: "text-bond-sand",
    accent: "text-bond-butter",
    rule: "border-bond-cream/20",
    surface: "surface-dark",
    muted: "text-bond-sand",
  },
};

/** Sección editorial con aire generoso, etiqueta, titular con reveal y contenido. */
export function Section({
  id,
  tone,
  label,
  title,
  children,
  className = "",
  labelledBy,
}: {
  id?: string;
  tone: Tone;
  label: string;
  /** Líneas del titular; el último nodo suele ser el acento en itálica */
  title: ReactNode[];
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const t = TONES[tone];
  const headingId = labelledBy ?? (id ? `${id}-titulo` : undefined);
  return (
    <section id={id} aria-labelledby={headingId} className={`${t.bg} ${t.text} ${t.surface} relative scroll-mt-4 ${className}`}>
      <div className="container-editorial py-24 md:py-40">
        <header className="mb-12 md:mb-20">
          <Label className={t.label}>{label}</Label>
          <RevealLines
            lines={title}
            className="display-serif mt-5 text-display-l"
            as="h2"
            id={headingId}
          />
        </header>
        {children}
      </div>
    </section>
  );
}

/** Palabra acento en itálica para los titulares. */
export function Accent({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`accent-italic ${TONES[tone].accent}`}>{children}</span>;
}
