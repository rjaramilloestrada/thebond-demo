"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { emails, payments, storage } from "@/adapters";
import { createTicketToken } from "@/domain/ticket-token";
import { useDbStore } from "@/store/db-store";
import { useDemoStore } from "@/store/demo-store";
import { useHasHydrated } from "@/store/hydrate";
import { safeStorage } from "@/store/safe-storage";
import { Label } from "@/components/brand/Label";

const ENTITIES = [
  ["editions", "Ediciones"],
  ["ticketTypes", "Tipos de entrada"],
  ["orders", "Órdenes"],
  ["tickets", "Entradas"],
  ["coupons", "Cupones"],
  ["waitlist", "Lista de espera"],
  ["checkIns", "Check-ins"],
  ["invoices", "Facturas"],
] as const;

type LogLine = { id: number; text: string; tone: "ok" | "error" | "info" };

const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-sm px-5 py-3 label-caps transition-colors duration-[var(--dur-fast)] disabled:cursor-wait disabled:opacity-60";
const btnPrimary = `${buttonBase} bg-bond-night text-bond-cream hover:bg-bond-moss`;
const btnOutline = `${buttonBase} border border-bond-night text-bond-night hover:bg-bond-night hover:text-bond-cream`;

export function StatePanel() {
  const hydrated = useHasHydrated();
  const counts = useDbStore(useShallow((s) => ({
    editions: Object.keys(s.editions).length,
    ticketTypes: Object.keys(s.ticketTypes).length,
    orders: Object.keys(s.orders).length,
    tickets: Object.keys(s.tickets).length,
    coupons: Object.keys(s.coupons).length,
    waitlist: Object.keys(s.waitlist).length,
    checkIns: Object.keys(s.checkIns).length,
    invoices: Object.keys(s.invoices).length,
  })));
  const firstTicket = useDbStore((s) => Object.values(s.tickets)[0]);
  const decline = useDemoStore((s) => s.forcePaymentDecline);
  const setFlag = useDemoStore((s) => s.setFlag);

  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [qr, setQr] = useState<{ src: string; token: string } | null>(null);

  // La rehidratación ya leyó el almacenamiento: si falló, safeStorage cayó a memoria.
  const persistent = hydrated ? safeStorage.isPersistent() : null;

  const push = useCallback((text: string, tone: LogLine["tone"] = "info") => {
    setLog((l) => [{ id: Date.now() + Math.random(), text, tone }, ...l].slice(0, 6));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      if (!firstTicket) return setQr(null);
      const token = await createTicketToken(firstTicket.id, firstTicket.version);
      const src = await QRCode.toDataURL(token, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: "M",
        color: {
          dark: cssToken("--bond-night"),
          light: cssToken("--bond-cream"),
        },
      });
      if (!cancelled) setQr({ src, token });
    }
    void build();
    return () => {
      cancelled = true;
    };
  }, [firstTicket]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  const charge = () =>
    run("charge", async () => {
      const order = (await storage.orders.list())[0];
      const t0 = performance.now();
      const result = await payments.createCharge(order);
      const ms = Math.round(performance.now() - t0);
      if (result.ok) push(`Cobro aprobado · ${result.chargeId} · ${ms} ms`, "ok");
      else push(`Cobro rechazado (${result.code}) · ${ms} ms`, "error");
    });

  const sendEmail = () =>
    run("email", async () => {
      const t0 = performance.now();
      await emails.send("ticket", "asistente01@ejemplo.com", { orderId: "ord-01" });
      push(`Correo de prueba registrado · ${Math.round(performance.now() - t0)} ms (no se envía)`, "ok");
    });

  const addCoupon = () =>
    run("coupon", async () => {
      const n = (await storage.coupons.list()).length + 1;
      await storage.coupons.save({
        id: `cp-prueba-${Date.now()}`,
        code: `PRUEBA${n}`,
        kind: "percent",
        value: 5,
        maxUses: 10,
        usedCount: 0,
        validFrom: null,
        validUntil: null,
        active: true,
        editionId: null,
      });
      push(`Cupón PRUEBA${n} guardado por el StorageAdapter`, "ok");
    });

  const reset = () =>
    run("reset", async () => {
      await storage.reset();
      useDemoStore.getState().resetFlags();
      push("Demo reiniciado: datos semilla restaurados", "ok");
    });

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div className="flex flex-col gap-10">
        <div>
          <Label className="text-bond-olive">Contenido del store</Label>
          <dl
            className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-bond-night/20 bg-bond-night/20 sm:grid-cols-4"
            data-testid="store-counts"
          >
            {ENTITIES.map(([key, label]) => (
              <div key={key} className="bg-bond-cream p-4">
                <dt className="label-caps !text-[0.625rem] text-bond-olive">{label}</dt>
                <dd className="mt-2 font-display text-4xl leading-none" data-count={key}>
                  {counts[key]}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-bond-night/80" data-testid="persist-status">
            {!hydrated
              ? "Cargando datos del demo…"
              : persistent
                ? "Persistencia: localStorage activo."
                : "Persistencia: localStorage no disponible; el demo sigue funcionando con respaldo en memoria."}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Label className="text-bond-olive">Adapters mock (600 a 1 200 ms)</Label>
          <label className="flex min-h-12 cursor-pointer items-center gap-4 rounded-md border border-bond-night/25 p-4">
            <input
              type="checkbox"
              checked={decline}
              onChange={(e) => setFlag("forcePaymentDecline", e.target.checked)}
              className="size-5 accent-[var(--bond-olive)]"
            />
            <span>
              <span className="block font-medium">Forzar pago rechazado</span>
              <span className="block text-sm text-bond-night/75">Interruptor del panel de demo que lee la caja de pagos simulada.</span>
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnPrimary} onClick={charge} disabled={busy !== null}>
              {busy === "charge" ? "Cobrando…" : "Probar cobro"}
            </button>
            <button type="button" className={btnOutline} onClick={sendEmail} disabled={busy !== null}>
              {busy === "email" ? "Enviando…" : "Correo de prueba"}
            </button>
            <button type="button" className={btnOutline} onClick={addCoupon} disabled={busy !== null}>
              Crear cupón de prueba
            </button>
            <button type="button" className={`${buttonBase} bg-bond-ember text-bond-cream hover:bg-bond-night`} onClick={reset} disabled={busy !== null}>
              Reiniciar demo
            </button>
          </div>
          <ul className="flex min-h-36 flex-col gap-2 text-sm" aria-live="polite" data-testid="adapter-log">
            {log.length === 0 && <li className="text-bond-night/70">Aún no hay llamadas. Prueba un botón.</li>}
            {log.map((l) => (
              <li key={l.id} className="flex items-start gap-3 border-l-2 pl-3" style={{ borderColor: l.tone === "error" ? "var(--bond-ember)" : "var(--bond-olive)" }}>
                {l.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5">
        <Label className="text-bond-olive">QR firmado de una entrada semilla</Label>
        <div className="grain relative w-full max-w-xs overflow-hidden rounded-md bg-bond-cream p-6 ring-1 ring-bond-night/20">
          {qr ? (
            <Image src={qr.src} alt="Código QR de la entrada de prueba" width={320} height={320} unoptimized className="h-auto w-full" />
          ) : (
            <div className="aspect-square w-full animate-pulse bg-bond-sand" />
          )}
        </div>
        <p className="max-w-xs break-all font-mono text-xs text-bond-night/75" data-testid="qr-token">
          {qr?.token ?? "…"}
        </p>
        <p className="max-w-xs text-sm text-bond-night/80">
          Token HMAC simulado (<code>ticketId.versión.firma</code>). Al transferir una entrada sube la versión y el QR anterior queda inválido.
        </p>
      </div>
    </div>
  );
}

/** Lee un color de tokens.css en tiempo de ejecución (el QR necesita un valor concreto). */
function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
