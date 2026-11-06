"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { EditionMeta } from "@/components/edition/EditionMeta";
import { Pending } from "@/components/Pending";
import { TicketQr } from "@/components/checkout/TicketQr";
import { buttonBase, buttonTones, quietLink } from "@/components/ui/button-styles";
import type { TokenState } from "@/domain/tickets";
import { emailHref, editionHref } from "@/lib/routes";
import { resolveToken, type TokenResolution } from "@/services/ticket-service";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { ReminderButton } from "./ReminderButton";
import { TransferSection } from "./TransferSection";

const shell = "surface-mid relative isolate overflow-hidden bg-bond-olive text-bond-cream";

const INVALID_REASON: Record<Exclude<TokenState, "valid">, string> = {
  transferred: "fue transferida",
  cancelled: "la orden fue cancelada",
  unknown: "no la reconocemos",
};

const INVALID_HELP: Record<Exclude<TokenState, "valid">, string> = {
  transferred:
    "Esta entrada tiene ahora otro QR. Si eres quien la recibió, usa el enlace del correo que te llegó. Si fuiste tú quien la transfirió, no tienes que hacer nada más.",
  cancelled: "La orden de esta entrada se canceló y el cupo se liberó.",
  unknown:
    "El código está incompleto o no corresponde a una entrada de este navegador (el demo guarda los datos solo aquí). Abre el enlace del correo tal como llegó.",
};

/**
 * "Mi entrada" (brief 6.3): `/entrada?t=<token>`. El token se verifica con
 * `verifyTicketToken` y se compara con lo guardado (existe, vigente y misma
 * versión): un QR anterior a una transferencia muestra "ya no es válida".
 */
export function EntryView({ token }: { token: string }) {
  const hydrated = useHasHydrated();
  const tickets = useDbStore((s) => s.tickets);
  const [res, setRes] = useState<TokenResolution | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Mientras se transfiere no se vuelve a resolver el token viejo (evita mostrar "transferida" un instante)
  const locked = useRef(false);

  useEffect(() => {
    locked.current = false;
  }, [token]);

  useEffect(() => {
    if (!hydrated || locked.current) return;
    let cancelled = false;
    void resolveToken(token).then((r) => {
      if (!cancelled && !locked.current) setRes(r);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, tickets]);

  const ticket = res?.ticket;
  const edition = useDbStore((s) => (ticket ? s.editions[ticket.editionId] : undefined));
  const ticketType = useDbStore((s) => (ticket ? s.ticketTypes[ticket.ticketTypeId] : undefined));
  const emails = useDbStore((s) => s.emails);

  const transferEmails = useMemo(
    () =>
      ticket
        ? Object.values(emails)
            .filter((e) => e.template === "transfer" && e.ticketId === ticket.id && e.ticketRefs?.[0]?.version === ticket.version)
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
        : [],
    [emails, ticket],
  );

  if (!hydrated || !res) return <main id="contenido" aria-busy="true" className={`${shell} min-h-svh`} />;

  if (res.state !== "valid" || !ticket || !edition) {
    const state = res.state === "valid" ? "unknown" : res.state;
    return (
      <main id="contenido" className={`${shell} min-h-svh`}>
        <div className="container-column relative z-10 pb-28 pt-36 md:pb-40 md:pt-48">
          <h1 data-testid="entrada-invalida" className="display-serif text-display-l">
            Esta entrada ya no es <span className="accent-italic text-bond-butter">válida</span>
          </h1>
          <p data-testid="entrada-invalida-motivo" className="mt-5 text-lead text-bond-cream">
            ({INVALID_REASON[state]})
          </p>
          <p className="mt-4 text-base text-bond-cream">{INVALID_HELP[state]}</p>
          <Link href="/" className={`${buttonBase} ${buttonTones.cream} mt-10`}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const link = `${quietLink} text-bond-cream hover:text-bond-butter`;
  return (
    <main id="contenido" className={shell}>
      <div className="container-column relative z-10 pb-24 pt-32 md:pb-36 md:pt-40">
        <h1 className="display-serif text-display-l">
          Mi <span className="accent-italic text-bond-butter">entrada.</span>
        </h1>

        {notice && (
          <p role="status" data-testid="transfer-ok" className="mt-8 border-l-2 border-bond-butter pl-4 text-base text-bond-cream">
            {notice}
          </p>
        )}

        <article
          data-testid="entrada"
          aria-label={`Entrada de ${ticket.attendee.name}`}
          className="mt-12 w-full bg-bond-cream text-bond-night md:mt-16"
        >
          <div className="flex items-start justify-between gap-4 p-6 pb-5 md:p-8 md:pb-6">
            <div className="min-w-0">
              <h2 className="display-serif text-heading">
                <span className="accent-italic">{edition.number} —</span> {edition.title}
              </h2>
              <EditionMeta edition={edition} teaser={false} className="mt-3 text-bond-olive" />
            </div>
            <Monogram size={56} title="" className="shrink-0 text-bond-night" />
          </div>

          <div aria-hidden className="relative h-0 border-t-2 border-dashed border-bond-night/40">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-bond-olive" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-bond-olive" />
          </div>

          <div className="flex flex-col items-center p-6 pt-8 text-center md:p-8 md:pt-10">
            <TicketQr
              ticketId={ticket.id}
              version={ticket.version}
              label={`Código QR de la entrada de ${ticket.attendee.name}`}
              size={240}
            />
            <p className="label-caps mt-5 text-bond-olive" data-testid="entrada-codigo">
              {ticket.id.toUpperCase()}
              {ticket.version > 1 ? ` · QR ${ticket.version}` : ""}
            </p>
            <p data-testid="entrada-asistente" className="display-serif mt-3 text-[1.5rem] leading-tight md:text-3xl">
              {ticket.attendee.name}
            </p>
            <p className="label-caps mt-2 text-bond-olive">{ticketType ? <Pending text={ticketType.name} dash /> : "Entrada"}</p>
          </div>
        </article>

        <nav aria-label="Acciones de la entrada" className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-1">
          <ReminderButton ticketId={ticket.id} className={link} />
          <Link href={editionHref(edition.slug)} className={link}>
            Ver la edición
          </Link>
          {transferEmails.map((e) => (
            <Link key={e.id} href={emailHref(e.id)} data-testid="correo-transferencia" className={link}>
              {e.transfer?.role === "previous-holder" ? "Correo a la titular anterior" : "Correo a la nueva titular"}
            </Link>
          ))}
        </nav>

        {!edition.isPast && (
          <div className="mt-14">
            <TransferSection
              key={`${ticket.id}-${ticket.version}`}
              ticket={ticket}
              onStart={() => {
                locked.current = true;
              }}
              onDone={(r) => {
                if (r.ok) {
                  setNotice(`Entrada transferida a ${r.toName}. Este es su QR nuevo: el anterior ya no es válido.`);
                  setRes(null);
                } else locked.current = false;
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
