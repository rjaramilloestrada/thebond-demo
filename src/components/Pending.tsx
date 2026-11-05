import { splitPending } from "@/lib/pending";

/**
 * Render visible de los marcadores `[[PENDIENTE: descripción]]` (brief 0.1).
 * Acepta un texto que puede mezclar texto normal y marcadores.
 * Los marcadores se resaltan para que nadie los confunda con datos reales.
 */
export function Pending({ text, className = "" }: { text: string; className?: string }) {
  const segments = splitPending(text);
  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i} className={className}>
            {seg.text}
          </span>
        ) : (
          <mark
            key={i}
            data-pending={seg.description}
            title="Dato pendiente de confirmar. Está registrado en PENDIENTES.md"
            className={`box-decoration-clone rounded-sm bg-bond-butter px-1.5 py-0.5 font-sans text-[0.85em] font-medium not-italic normal-case tracking-normal text-bond-night ring-1 ring-bond-night/25 ${className}`}
          >
            {seg.raw}
          </mark>
        ),
      )}
    </>
  );
}
