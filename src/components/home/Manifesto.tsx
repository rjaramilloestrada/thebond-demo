import { RevealLines } from "@/components/Reveal";

/**
 * Una sola línea de manifiesto (brief 3.3): "Come solo. Leave connected.", en
 * butter sobre oliva (5.27, AA). Es la única pieza con la sans condensada pesada.
 */
export function Manifesto() {
  return (
    <section aria-label="Manifiesto" className="surface-mid flex min-h-[80svh] items-center bg-bond-olive text-bond-butter">
      <div className="container-editorial py-24 md:py-40">
        <RevealLines
          as="p"
          lines={["Come solo.", "Leave connected."]}
          className="display-sans text-[clamp(2.75rem,1rem+10vw,9rem)] leading-[0.92]"
        />
      </div>
    </section>
  );
}
