"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/brand/Label";
import { Monogram } from "@/components/brand/Monogram";
import { Pending } from "@/components/Pending";
import { TicketQr } from "@/components/checkout/TicketQr";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import type { TokenState } from "@/domain/tickets";
import { emailHref, editionHref } from "@/lib/routes";
import { resolveToken, type TokenResolution } from "@/services/ticket-service";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { ReminderButton } from "./ReminderButton";
import { TransferSection } from "./TransferSection";

const shell = "surface-dark grain relative isolate overflow-hidden bg-bond-night text-bond-cream";

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
      <main id="contenido" className={shell}>
        <div className="sunset-sun opacity-40" aria-hidden style={{ ["--sun-x" as string]: "50%", ["--sun-y" as string]: "-25%" }} />
        <div className="container-editorial relative z-10 pb-28 pt-36 md:pb-40 md:pt-48">
          <Label className="text-bond-sand">Mi entrada</Label>
          <h1 data-testid="entrada-invalida" className="display-serif mt-5 max-w-3xl text-display-l">
            Esta entrada ya no es <span className="accent-italic text-bond-butter">válida</span>
          </h1>
          <p data-testid="entrada-invalida-motivo" className="mt-5 text-lead text-bond-cream">
            ({INVALID_REASON[state]})
          </p>
          <p className="mt-4 max-w-lg text-base text-bond-sand">{INVALID_HELP[state]}</p>
          <Link href="/" className={`${buttonBase} ${buttonTones.butter} mt-10`}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const cardLink = `${buttonBase} ${buttonTones.butter} w-full sm:w-auto`;
  return (
    <main id="contenido" className={shell}>
      <div className="sunset-sun opacity-50" aria-hidden style={{ ["--sun-x" as string]: "50%", ["--sun-y" as string]: "-20%" }} />
      <div className="container-editorial relative z-10 pb-24 pt-32 md:pb-36 md:pt-44">
        <Label className="text-bond-sand">Mi entrada · Edición {edition.number}</Label>
        <h1 className="display-serif mt-5 text-display-l">
          Mi <span className="accent-italic text-bond-butter">entrada.</span>
        </h1>

        {notice && (
          <p
            role="status"
            data-testid="transfer-ok"
            className="mt-8 max-w-xl border border-bond-butter p-4 text-base text-bond-cream"
          >
            {notice}
          </p>
        )}

        <article
          data-testid="entrada"
          aria-label={`Entrada de ${ticket.attendee.name}`}
          className="mx-auto mt-12 w-full max-w-md bg-bond-cream text-bond-night md:mt-16"
        >
          <div className="flex items-start justify-between gap-4 p-6 pb-5 md:p-8 md:pb-6">
            <div className="min-w-0">
              <p className="label-caps text-bond-olive">The Bond · Edición {edition.number}</p>
              <h2 className="display-serif mt-3 text-heading">{edition.title}</h2>
              <p className="mt-3 text-sm">
                <Pending text={edition.dateLabel} />
              </p>
              <p className="text-sm text-bond-olive">
                <Pending text={edition.venueName} />
              </p>
            </div>
            <Monogram size={64} title="" className="shrink-0 text-bond-night" />
          </div>

          <div aria-hidden className="relative h-0 border-t-2 border-dashed border-bond-night/40">
            <span className="absolute -left-3 -top-3 size-6 rounded-full bg-bond-night" />
            <span className="absolute -right-3 -top-3 size-6 rounded-full bg-bond-night" />
          </div>

          <div className="flex flex-col items-center p-6 pt-8 text-center md:p-8 md:pt-10">
            <TicketQr
              ticketId={ticket.id}
              version={ticket.version}
              label={`Código QR de la entrada de ${ticket.attendee.name}`}
              size={256}
            />
            <p className="label-caps mt-5 text-bond-olive" data-testid="entrada-codigo">
              {ticket.id.toUpperCase()}
              {ticket.version > 1 ? ` · QR ${ticket.version}` : ""}
            </p>
            <p data-testid="entrada-asistente" className="display-serif mt-3 text-[1.75rem] leading-tight md:text-3xl">
              {ticket.attendee.name}
            </p>
            <p className="mt-2 text-sm">{ticketType ? <Pending text={ticketType.name} /> : "Entrada"}</p>
            <p className="mt-4 text-sm text-bond-olive">Muestra este QR en la puerta.</p>
          </div>
        </article>

        <div className="mx-auto mt-10 grid max-w-md gap-4 sm:max-w-xl sm:grid-cols-2">
          <ReminderButton ticketId={ticket.id} className={cardLink} />
          <Link href={editionHref(edition.slug)} className={`${buttonBase} ${buttonTones.outlineDark} w-full sm:w-auto`}>
            Ver la edición
          </Link>
        </div>

        {transferEmails.length > 0 && (
          <div className="mx-auto mt-8 max-w-md sm:max-w-xl">
            <p className="label-caps text-bond-sand">Correos de la transferencia</p>
            <ul className="mt-3 grid gap-2">
              {transferEmails.map((e) => (
                <li key={e.id}>
                  <Link
                    href={emailHref(e.id)}
                    data-testid="correo-transferencia"
                    className="inline-flex min-h-11 items-center text-bond-cream underline underline-offset-4 hover:text-bond-butter"
                  >
                    {e.transfer?.role === "previous-holder" ? "Ver correo a la titular anterior" : "Ver correo a la nueva titular"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!edition.isPast && (
          <div className="mx-auto mt-14 max-w-md sm:max-w-xl">
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
