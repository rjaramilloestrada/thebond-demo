/**
 * Helpers para los placeholders `[[PENDIENTE: descripción]]` (regla 0.1 del brief).
 * Todo dato que no esté en el brief se escribe con `pending("...")`, se ve en
 * pantalla con el componente <Pending /> y se registra en PENDIENTES.md.
 */

export type PendingString = `[[PENDIENTE: ${string}]]`;

export function pending(description: string): PendingString {
  return `[[PENDIENTE: ${description}]]`;
}

const PENDING_SOURCE = "\\[\\[PENDIENTE:\\s*([^\\]]*?)\\s*\\]\\]";

export function isPending(value: string | null | undefined): boolean {
  if (!value) return false;
  return new RegExp(PENDING_SOURCE).test(value);
}

export type PendingSegment =
  | { kind: "text"; text: string }
  | { kind: "pending"; description: string; raw: string };

/** Divide un texto en segmentos de texto normal y marcadores pendientes. */
export function splitPending(value: string): PendingSegment[] {
  const segments: PendingSegment[] = [];
  let last = 0;
  for (const match of value.matchAll(new RegExp(PENDING_SOURCE, "g"))) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: "text", text: value.slice(last, index) });
    segments.push({ kind: "pending", description: match[1], raw: match[0] });
    last = index + match[0].length;
  }
  if (last < value.length) segments.push({ kind: "text", text: value.slice(last) });
  return segments;
}

/** true si el valor trae un dato real (no vacío y sin ningún marcador pendiente). */
export function hasData(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return false;
  return !isPending(value);
}

/**
 * Quita los marcadores de un texto (modo presentación): "Murano Plaza · [[PENDIENTE: x]]"
 * queda como "Murano Plaza". Retira también los separadores que quedan colgando
 * (·, —, comas) y los espacios sobrantes. Devuelve "" si no queda nada.
 */
export function stripPending(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(new RegExp(PENDING_SOURCE, "g"), "")
    .replace(/\s*[·—,;:|-]\s*(?=[·—,;:|-]|$)/g, "")
    .replace(/^[\s·—,;:|-]+|[\s·—,;:|-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** true si todos los valores son pendientes o están vacíos (la sección entera pasa a ser un teaser). */
export function allPending(values: readonly (string | null | undefined)[]): boolean {
  return values.every((v) => !hasData(v) && stripPending(v) === "");
}

/** true si algún valor trae un dato real (aunque otros sigan pendientes). */
export function anyData(values: readonly (string | null | undefined)[]): boolean {
  return values.some((v) => stripPending(v) !== "");
}
