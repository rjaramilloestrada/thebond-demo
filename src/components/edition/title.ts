/**
 * Parte el nombre de una edición en líneas para el titular del hero.
 * "The Power Hour" → lead "The" (itálica) + ["Power", "Hour"].
 * `size` baja a `l` cuando hay una palabra larga ("Experience") para que quepa a 390 px.
 */
export function titleParts(title: string): { lead: string | null; words: string[]; size: "xl" | "l" } {
  const parts = title.trim().split(/\s+/);
  const hasLead = parts.length > 1 && parts[0].toLowerCase() === "the";
  const words = hasLead ? parts.slice(1) : parts;
  const longest = Math.max(...words.map((w) => w.length));
  return { lead: hasLead ? parts[0] : null, words, size: longest > 6 ? "l" : "xl" };
}
