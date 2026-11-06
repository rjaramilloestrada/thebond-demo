"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { createTicketToken } from "@/domain/ticket-token";

/** Lee un color de tokens.css en tiempo de ejecución (el QR necesita un valor concreto). */
function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * QR único de una entrada: el contenido es el token firmado
 * `createTicketToken(ticketId, version)`. Si la entrada se transfiere (Fase 4)
 * la versión sube y el QR anterior deja de valer. Reserva su tamaño mientras
 * se genera, así que no mueve el diseño.
 */
export function TicketQr({
  ticketId,
  version,
  label,
  size = 176,
}: {
  ticketId: string;
  version: number;
  label: string;
  size?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const token = await createTicketToken(ticketId, version);
      const url = await QRCode.toDataURL(token, {
        margin: 1,
        width: size * 2,
        errorCorrectionLevel: "M",
        color: { dark: cssToken("--bond-night"), light: cssToken("--bond-cream") },
      });
      if (!cancelled) setSrc(url);
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [ticketId, version, size]);

  return (
    <div style={{ width: size, height: size }} className="bg-bond-cream">
      {src ? (
        // Data URL generada en el cliente: next/image no aporta nada aquí
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} width={size} height={size} data-testid="ticket-qr" className="block size-full" />
      ) : (
        <div className="size-full animate-pulse bg-bond-sand motion-reduce:animate-none" role="img" aria-label="Generando el código QR" />
      )}
    </div>
  );
}
