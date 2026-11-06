"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Pending, WhenShowingPending } from "@/components/Pending";
import { buttonBase, buttonTones, quietLink } from "@/components/ui/button-styles";
import { formatMoney } from "@/domain/pricing";
import { loadInvoicePreview, type InvoicePreview } from "@/services/preview-service";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { formatEcuadorDate, formatEcuadorDateTime } from "./format";

const TAX_LABEL = { cedula: "Cédula", ruc: "RUC" } as const;

/** Casilla con borde fino, como las cajas del RIDE del SRI. */
function Box({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`break-inside-avoid border border-bond-night p-3 sm:p-4 ${className}`}>
      {title && <h2 className="label-caps mb-2 text-bond-olive">{title}</h2>}
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-3 py-0.5 text-sm sm:grid-cols-[8.5rem_1fr]">
      <dt className="label-caps self-start pt-[0.2rem] text-bond-olive">{label}</dt>
      <dd className="min-w-0 break-words text-bond-night">{children}</dd>
    </div>
  );
}

/**
 * Vista previa del RIDE (representación impresa de la factura electrónica del
 * SRI) con la marca de agua "DEMO, SIN VALIDEZ TRIBUTARIA". Los datos del
 * emisor son pendientes de la clienta; la numeración, la clave de acceso y la
 * autorización son ficticias. A4 al imprimir (`@page` en globals.css).
 */
export function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const exists = useDbStore((s) => Boolean(s.invoices[invoiceId]));
  const [data, setData] = useState<InvoicePreview | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void loadInvoicePreview(invoiceId).then((r) => {
      if (!cancelled) setData(r);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, invoiceId, exists]);

  return (
    <main id="contenido" className="min-h-svh bg-bond-sand pt-[4.5rem] text-bond-night md:pt-24 print:min-h-0 print:bg-transparent print:pt-0">
      <div className="container-editorial pb-6 pt-8 md:pt-10 print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <p className="label-caps text-bond-olive">Vista previa · factura electrónica de demo</p>
          <div className="flex flex-wrap items-center gap-x-6">
            <button
              type="button"
              data-testid="descargar-pdf"
              disabled={!data?.ok}
              onClick={() => window.print()}
              className={`${buttonBase} ${buttonTones.olive} !min-h-12 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else router.push("/");
              }}
              className={`${quietLink} text-bond-night`}
            >
              Volver
            </button>
          </div>
        </div>
      </div>

      <div className="container-editorial pb-12 pt-2 md:pb-20 print:p-0">
        {!data && <p aria-live="polite" className="py-10 text-lead text-bond-olive">Armando la factura…</p>}
        {data && !data.ok && (
          <div className="mx-auto max-w-xl py-10">
            <h1 className="display-serif text-display-m">
              Factura no <span className="accent-italic text-bond-ember">disponible</span>
            </h1>
            <p className="mt-4 text-lead text-bond-olive">{data.message}</p>
            <Link href="/" className={`${buttonBase} ${buttonTones.olive} mt-8`}>
              Volver al inicio
            </Link>
          </div>
        )}
        {data?.ok && <Ride data={data} />}
      </div>
    </main>
  );
}

function Ride({ data }: { data: Extract<InvoicePreview, { ok: true }> }) {
  const { invoice, order, edition, lines, taxKind } = data;
  const example = invoice.isExample;
  const money = (cents: number, isExample = example) => formatMoney(cents, { isExample });
  const coupon = order.couponCode;
  const emisor = [
    ["Razón social", "[[PENDIENTE: razón social de la clienta]]"],
    ["Nombre comercial", "THE BOND"],
    ["Dirección matriz", "[[PENDIENTE: dirección matriz de la clienta]]"],
    ["Contabilidad", "[[PENDIENTE: confirmar si la clienta está obligada a llevar contabilidad]]"],
  ] as const;

  return (
    <article
      data-testid="ride"
      aria-label={`Factura ${invoice.number}`}
      className="paper-edge relative mx-auto w-full max-w-[210mm] overflow-hidden bg-bond-cream p-4 text-bond-night sm:p-8 print:max-w-none print:overflow-visible print:bg-transparent print:p-0 print:shadow-none"
    >
      {/* Marca de agua: grande, diagonal y sobre todo el documento (también al imprimir) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
        <p
          data-testid="ride-marca-agua"
          className="display-serif max-w-[88%] -rotate-[28deg] select-none text-center text-[3.25rem] leading-[0.95] text-bond-night/[0.1] sm:text-[5.5rem] print:text-[5.5rem]"
        >
          DEMO, SIN VALIDEZ TRIBUTARIA
        </p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-4">
          <Logo width={176} className="text-bond-night" />
          <Box title="Emisor">
            <dl>
              {emisor.map(([label, value]) => (
                <Row key={label} label={label}>
                  <Pending text={value} dash />
                </Row>
              ))}
            </dl>
          </Box>
        </div>
        <Box>
          <dl>
            <Row label="R.U.C.">
              <Pending text="[[PENDIENTE: RUC de la clienta]]" dash />
            </Row>
          </dl>
          <p className="display-serif mt-2 text-3xl leading-none sm:text-4xl">Factura</p>
          <p data-testid="ride-numero" className="mt-1 font-display text-xl">
            No. {invoice.number}
          </p>
          <dl className="mt-3 border-t border-bond-night/30 pt-2">
            <Row label="Autorización">DEMO · sin autorización del SRI</Row>
            <Row label="Fecha y hora">{formatEcuadorDateTime(invoice.issuedAt)}</Row>
            <Row label="Ambiente">DEMO (no es pruebas ni producción)</Row>
            <Row label="Clave de acceso">
              <span className="font-mono text-xs">DEMO-0000-0000-0000-SIN-VALIDEZ</span>
            </Row>
          </dl>
        </Box>
      </div>

      <Box title="Comprador" className="relative mt-4">
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <Row label="Razón social">
            <span data-testid="ride-comprador">{invoice.buyerName}</span>
          </Row>
          <Row label={TAX_LABEL[taxKind]}>
            <span data-testid="ride-identificacion">{invoice.buyerTaxId}</span>
          </Row>
          <Row label="Emisión">{formatEcuadorDate(invoice.issuedAt)}</Row>
          <Row label="Correo">{order.buyer.email}</Row>
        </dl>
      </Box>

      <section aria-label="Detalle" className="relative mt-4 overflow-x-auto border border-bond-night">
        <table data-testid="ride-detalle" className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-bond-night">
              {["Cant.", "Descripción", "P. unitario", "Total"].map((h, i) => (
                <th key={h} scope="col" className={`label-caps px-3 py-2 text-bond-olive ${i > 1 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-bond-night/30 align-top last:border-b-0">
                <td className="px-3 py-3 tabular-nums">{l.quantity}</td>
                <td className="px-3 py-3">
                  <span className="block font-medium">
                    <Pending text={l.description} dash />
                  </span>
                  <span className="block text-bond-olive">{l.detail}</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{money(l.unitCents, l.isExample)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{money(l.totalCents, l.isExample)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="relative mt-4 grid gap-4 sm:grid-cols-[1fr_17rem] sm:gap-6">
        <Box title="Información adicional">
          <dl>
            <Row label="Orden">{order.id.replace(/^ord-/, "").toUpperCase()}</Row>
            {edition && <Row label="Edición">{`${edition.number} · ${edition.title}`}</Row>}
            {coupon && <Row label="Cupón">{coupon}</Row>}
            <Row label="Forma de pago">Tarjeta de prueba (caja de pagos simulada)</Row>
            <WhenShowingPending>
              <Row label="Pendiente">
                <Pending text="[[PENDIENTE: códigos de producto y demás campos del RIDE según la ficha técnica del SRI]]" />
              </Row>
            </WhenShowingPending>
          </dl>
        </Box>
        <Box>
          <dl data-testid="ride-totales" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-bond-olive">Subtotal sin impuestos</dt>
            <dd className="text-right tabular-nums">{money(order.subtotalCents)}</dd>
            <dt className="text-bond-olive">Descuento{coupon ? ` (${coupon})` : ""}</dt>
            <dd className="text-right tabular-nums">{order.discountCents > 0 ? money(order.discountCents) : "—"}</dd>
            <dt className="text-bond-olive">
              IVA (<Pending text="[[PENDIENTE: tarifa de IVA aplicable]]" dash />)
            </dt>
            <dd className="text-right tabular-nums">{example ? "$XX" : <Pending text="[[PENDIENTE: monto de IVA]]" dash />}</dd>
            <dt className="label-caps self-end border-t border-bond-night pt-3 text-bond-night">Valor total</dt>
            <dd data-testid="ride-total" className="border-t border-bond-night pt-3 text-right font-display text-3xl leading-none tabular-nums">
              {money(invoice.totalCents)}
            </dd>
          </dl>
          <p className="mt-3 text-xs text-bond-olive">
            <Pending text="[[PENDIENTE: confirmar si el precio publicado incluye IVA]]" />
            {example && " Montos de ejemplo."}
          </p>
        </Box>
      </div>

      <p className="relative mt-6 border-t border-bond-night/30 pt-3 text-xs text-bond-olive">
        Documento de demostración generado en el navegador. Sin validez tributaria: no está firmado ni autorizado por el SRI.
      </p>
    </article>
  );
}
