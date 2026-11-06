"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/brand/Label";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import type { EmailLog } from "@/domain/types";
import { BASE_PATH } from "@/lib/site";
import { loadEmailPreview } from "@/services/preview-service";
import { useDbStore } from "@/store/db-store";
import { useHasHydrated } from "@/store/hydrate";
import { currentSiteUrl, formatEcuadorDateTime } from "./format";

type State =
  | { status: "loading" }
  | { status: "ready"; log: EmailLog; html: string }
  | { status: "error"; message: string };

/**
 * Vista previa de un correo (brief 6.3). El HTML se arma en el navegador con
 * React Email a partir del registro `EmailLog` y se muestra en un iframe con
 * `sandbox` (sin scripts) y `srcDoc`, bajo la barra "este correo no se envía".
 */
export function EmailPreviewView({ emailId }: { emailId: string }) {
  const hydrated = useHasHydrated();
  const emailExists = useDbStore((s) => Boolean(s.emails[emailId]));
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      const result = await loadEmailPreview(emailId, currentSiteUrl(BASE_PATH));
      if (!result.ok) {
        if (!cancelled) setState({ status: "error", message: result.message });
        return;
      }
      // React Email (y su render) solo se descarga aquí: ninguna otra pantalla lo necesita
      const { renderEmailHtml } = await import("@/emails/render");
      const html = await renderEmailHtml(result.model);
      if (!cancelled) setState({ status: "ready", log: result.log, html });
    })().catch(() => {
      if (!cancelled) setState({ status: "error", message: "No se pudo armar la vista previa de este correo." });
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, emailId, emailExists]);

  return (
    <main id="contenido" className="min-h-svh bg-bond-sand">
      <div className="surface-dark grain relative isolate overflow-hidden bg-bond-night pb-8 pt-28 text-bond-cream md:pb-10 md:pt-32">
        <div className="container-editorial relative z-10">
          <Label className="text-bond-butter">Vista previa · este correo no se envía</Label>
          {state.status === "ready" ? (
            <dl data-testid="correo-barra" className="mt-5 grid gap-x-10 gap-y-3 text-base md:grid-cols-[auto_1fr] md:gap-y-2">
              <dt className="label-caps text-bond-sand">Para</dt>
              <dd data-testid="correo-para" className="min-w-0 break-words">
                {state.log.to}
              </dd>
              <dt className="label-caps text-bond-sand">Asunto</dt>
              <dd data-testid="correo-asunto" className="min-w-0 break-words font-display text-xl md:text-2xl">
                {state.log.subject}
              </dd>
              <dt className="label-caps text-bond-sand">Fecha</dt>
              <dd className="min-w-0">{formatEcuadorDateTime(state.log.sentAt)}</dd>
            </dl>
          ) : (
            <p className="mt-5 text-lead text-bond-sand" aria-live="polite">
              {state.status === "loading" ? "Armando la vista previa…" : state.message}
            </p>
          )}
          <p className="mt-5 max-w-xl text-sm text-bond-sand">
            Es un demo: el correo se muestra tal como se vería, pero no se envía a nadie. En producción lo enviaría el servicio de correo.
          </p>
        </div>
      </div>

      <div className="container-editorial py-8 md:py-12">
        {state.status === "ready" && <EmailFrame html={state.html} />}
        {state.status === "error" && (
          <div className="mx-auto max-w-xl py-10">
            <h1 className="display-serif text-display-m">
              Correo no <span className="accent-italic text-bond-ember">disponible</span>
            </h1>
            <Link href="/" className={`${buttonBase} ${buttonTones.night} mt-8`}>
              Volver al inicio
            </Link>
          </div>
        )}
        {state.status === "ready" && (
          <div className="mx-auto mt-8 max-w-[40rem]">
            <BackButton />
          </div>
        )}
      </div>
    </main>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) window.history.back();
        else router.push("/");
      }}
      className={`${buttonBase} ${buttonTones.outlineLight} w-full sm:w-auto`}
    >
      Volver
    </button>
  );
}

/**
 * iframe con `sandbox`: sin scripts. `allow-same-origin` solo sirve para medir
 * el alto del documento (no hay scripts que lo aprovechen) y `allow-popups`
 * deja abrir los enlaces del correo en otra pestaña.
 */
function EmailFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc?.documentElement) return;
    setHeight(Math.ceil(doc.documentElement.scrollHeight));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <iframe
      ref={ref}
      title="Vista previa del correo"
      data-testid="correo-iframe"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={html}
      onLoad={() => {
        measure();
        const doc = ref.current?.contentDocument;
        if (doc?.documentElement && typeof ResizeObserver !== "undefined") {
          new ResizeObserver(measure).observe(doc.documentElement);
        }
      }}
      style={{ height }}
      className="mx-auto block w-full max-w-[40rem] border-0 bg-bond-sand shadow-[0_0_0_1px_color-mix(in_srgb,var(--bond-night)_18%,transparent)]"
    />
  );
}
