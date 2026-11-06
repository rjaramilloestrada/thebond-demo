"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { EditionMeta } from "@/components/edition/EditionMeta";
import { Pending } from "@/components/Pending";
import { createTicketToken } from "@/domain/ticket-token";
import type { Edition, Ticket, TicketType } from "@/domain/types";
import { entryHref } from "@/lib/routes";
import { TicketQr } from "./TicketQr";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Token QR firmado de la versión vigente de la entrada (para enlazar a "Mi entrada"). */
function useTicketToken(ticketId: string, version: number): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void createTicketToken(ticketId, version).then((t) => {
      if (!cancelled) setToken(t);
    });
    return () => {
      cancelled = true;
    };
  }, [ticketId, version]);
  return token;
}

/**
 * Ticket que se "imprime" (wow 4, brief 4.2). Cada entrada sale de la ranura de
 * arriba: una máscara (`clipPath`) descubre el papel hacia abajo mientras el
 * ticket se desliza (`y`), y los tickets salen uno tras otro. Con
 * `prefers-reduced-motion` solo hace un fade.
 */
export function PrintedTicket({
  ticket,
  ticketType,
  edition,
  index,
  total,
}: {
  ticket: Ticket;
  ticketType: TicketType | undefined;
  edition: Edition;
  index: number;
  total: number;
}) {
  const reduce = useReducedMotion();
  const token = useTicketToken(ticket.id, ticket.version);
  const delay = reduce ? 0 : 0.35 + index * 0.9;
  const duration = reduce ? 0.25 : 1.15;
  return (
    <motion.li
      data-testid="printed-ticket"
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration, delay, ease: EASE }}
      className="list-none"
    >
      <motion.article
        initial={reduce ? false : { y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration, delay, ease: EASE }}
        aria-label={`Entrada ${index + 1} de ${total}: ${ticket.attendee.name}`}
        className="relative bg-bond-cream text-bond-night"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-5 md:p-8 md:pb-6">
          <div className="min-w-0">
            <h3 className="display-serif text-heading">
              <span className="accent-italic">{edition.number} —</span> {edition.title}
            </h3>
            <EditionMeta edition={edition} teaser={false} className="mt-3 text-bond-olive" />
          </div>
          <Monogram size={56} title="" className="shrink-0 text-bond-night" />
        </div>

        {/* Perforación */}
        <div aria-hidden className="relative h-0 border-t-2 border-dashed border-bond-night/40">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-bond-night" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-bond-night" />
        </div>

        <div className="flex items-end justify-between gap-5 p-6 pt-6 md:p-8 md:pt-7">
          <div className="min-w-0">
            <p className="display-serif text-[1.5rem] leading-tight md:text-3xl" data-testid="ticket-name">
              {ticket.attendee.name}
            </p>
            <p className="label-caps mt-2 text-bond-olive">{ticketType ? <Pending text={ticketType.name} dash /> : "Entrada"}</p>
            <div className="mt-3 min-h-11">
              {token && (
                <Link
                  href={entryHref(token)}
                  data-testid="mi-entrada"
                  className="label-caps inline-flex min-h-11 items-center text-bond-night underline underline-offset-[0.55em] decoration-[0.5px] hover:text-bond-moss"
                >
                  Mi entrada <span aria-hidden className="ml-2">→</span>
                </Link>
              )}
            </div>
          </div>
          <TicketQr
            ticketId={ticket.id}
            version={ticket.version}
            label={`Código QR de la entrada de ${ticket.attendee.name}`}
            size={132}
          />
        </div>
      </motion.article>
    </motion.li>
  );
}
