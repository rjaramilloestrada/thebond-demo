"use client";

import Link from "next/link";
import type { EditionLive } from "@/domain/selectors";
import { buttonBase, buttonTones, type ButtonTone } from "@/components/ui/button-styles";
import { useEditionLive } from "./useEditionLive";

/**
 * Un solo CTA "Get your ticket" que lleva a la edición (`#entradas` abre la hoja
 * de compra). Si la edición está agotada (incluye el interruptor `forceSoldOut`
 * del demo) pasa a "Lista de espera".
 */
export function EditionCta({
  initial,
  href,
  soldOutHref,
  tone = "olive",
  className = "",
  label = "Get your ticket",
  soldOutLabel = "Lista de espera",
}: {
  initial: EditionLive;
  href: string;
  soldOutHref: string;
  tone?: ButtonTone;
  className?: string;
  label?: string;
  soldOutLabel?: string;
}) {
  const live = useEditionLive(initial);
  const soldOut = live.soldOut;
  return (
    <Link href={soldOut ? soldOutHref : href} className={`${buttonBase} ${buttonTones[tone]} ${className}`}>
      {soldOut ? soldOutLabel : label}
      <span aria-hidden className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
