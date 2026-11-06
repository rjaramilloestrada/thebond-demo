import { Label } from "@/components/brand/Label";
import { RevealLines } from "@/components/Reveal";

/** Frases reales del feed (brief 3.3), textuales. */
const PHRASES: string[][] = [
  ["Come solo.", "Leave connected."],
  ["More than a workout.", "It's a BOND."],
  ["Good energy,", "better company."],
];

/** Manifiesto en líneas: display sans butter sobre olive (5.27, AA). */
export function Manifesto() {
  return (
    <section aria-label="Manifiesto" className="surface-mid bg-bond-olive text-bond-butter">
      <div className="container-editorial py-24 md:py-40">
        <Label className="text-bond-cream">Manifiesto</Label>
        <ol className="mt-12 md:mt-20">
          {PHRASES.map((lines, i) => (
            <li key={i} className="grid gap-4 border-t border-bond-cream/30 py-10 md:grid-cols-[7rem_1fr] md:py-16">
              <span aria-hidden className="font-display text-2xl italic text-bond-cream md:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <RevealLines as="p" lines={lines} className="display-sans text-display-m md:text-display-l" />
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-bond-cream/30 pt-10 font-display text-3xl italic leading-tight text-bond-cream md:pt-16 md:text-6xl">
          Come for the experience. Stay for the bond.
        </p>
      </div>
    </section>
  );
}
