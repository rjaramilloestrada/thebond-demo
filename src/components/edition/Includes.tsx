"use client";

import { useState } from "react";
import { RevealLines } from "@/components/Reveal";
import type { IncludeItem } from "@/domain/types";

/**
 * "Your ticket includes": cuatro palabras en una cuadrícula (estructura real de
 * la ed. 001: brief 2 y 6.1). Al tocar una se abre su detalle debajo (una a la vez).
 */
export function Includes({ includes }: { includes: IncludeItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = includes.find((i) => i.id === openId);
  return (
    <section id="incluye" aria-labelledby="incluye-titulo" className="surface-mid bg-bond-olive text-bond-cream">
      <div className="container-editorial py-24 md:py-40">
        <RevealLines
          as="h2"
          id="incluye-titulo"
          className="display-serif text-display-m"
          lines={["Your ticket", <span key="a" className="accent-italic text-bond-butter">includes</span>]}
        />
        <ul className="mt-14 grid grid-cols-2 gap-x-8 border-t border-bond-cream/30 md:mt-20 md:grid-cols-4 md:gap-x-12">
          {includes.map((inc) => {
            const active = inc.id === openId;
            return (
              <li key={inc.id} className="border-b border-bond-cream/30">
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls="incluye-detalle"
                  onClick={() => setOpenId(active ? null : inc.id)}
                  className="flex min-h-24 w-full items-start justify-between gap-4 py-6 text-left md:min-h-36"
                >
                  <span className="display-serif text-[1.125rem] leading-tight md:text-[1.5rem]">{inc.title}</span>
                  <span
                    aria-hidden
                    className={`mt-0.5 shrink-0 text-xl leading-none transition-transform duration-[var(--dur-base)] ease-[var(--bond-ease)] ${active ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div id="incluye-detalle" role="region" aria-label="Detalle de tu entrada" aria-live="polite" className="min-h-[2.5rem] pt-6">
          {open && <p className="max-w-xl text-lead text-bond-cream">{open.description}</p>}
        </div>
      </div>
    </section>
  );
}
