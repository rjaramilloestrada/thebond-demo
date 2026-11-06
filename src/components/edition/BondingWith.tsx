"use client";

import { Pending, Teaser, useShowPending } from "@/components/Pending";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { FadeIn } from "@/components/Reveal";
import { hasData } from "@/lib/pending";
import type { Brand } from "@/domain/types";

/**
 * "Bonding with": una fila tranquila con las marcas aliadas, sin movimiento
 * continuo. Con datos reales solo muestra los nombres (el logo llegará con el
 * permiso de cada marca); lo que sigue pendiente queda como "Partners reveal ·
 * soon". Con "Mostrar pendientes" encendido salen todas, con su logo provisional
 * rotulado y su @usuario. `quietWhenEmpty` (ediciones pasadas) no muestra nada si no hay marcas con datos.
 */
export function BondingWith({ brands, quietWhenEmpty = false }: { brands: Brand[]; quietWhenEmpty?: boolean }) {
  const showPending = useShowPending();
  if (brands.length === 0) return null;
  const known = brands.filter((b) => hasData(b.name));
  const hasPending = brands.length > known.length;
  if (!showPending && quietWhenEmpty && known.length === 0) return null;
  const list = showPending ? brands : known;
  return (
    <section aria-label="Marcas aliadas" className="bg-bond-sand text-bond-night">
      <div className="container-editorial flex flex-col items-center py-24 text-center md:py-36">
        <FadeIn>
          <p className="font-display text-3xl italic leading-none md:text-5xl">Bonding with</p>
        </FadeIn>
        {list.length > 0 && (
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-14 gap-y-8 md:mt-16">
            {list.map((b, i) => (
              <li key={b.id}>
                <FadeIn delay={0.15 * i}>
                  {showPending && (
                    <PlaceholderImage
                      asset={b.logoAsset}
                      width={640}
                      sizes="144px"
                      alt=""
                      className="mx-auto mb-4 aspect-[3/2] h-auto w-36 object-cover"
                    />
                  )}
                  <span className="display-serif text-heading tracking-[0.18em]">
                    <Pending text={b.name} dash />
                  </span>
                  {showPending && (
                    <span className="mt-2 block text-sm text-bond-moss">
                      <Pending text={b.handle} />
                    </span>
                  )}
                </FadeIn>
              </li>
            ))}
          </ul>
        )}
        {hasPending && !showPending && (
          <div className="mt-12 flex justify-center">
            <Teaser label="Partners reveal" />
          </div>
        )}
      </div>
    </section>
  );
}
