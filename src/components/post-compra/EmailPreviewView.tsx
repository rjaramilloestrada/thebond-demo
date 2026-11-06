"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import type { EmailLog } from "@/domain/types";
import { BASE_PATH } from "@/lib/site";
import { loadEmailPreview } from "@/services/preview-service";
import { useDbStore } from "@/store/db-store";
import { useDemoStore } from "@/store/demo-store";
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
  const showPending = useDemoStore((s) => s.showPending);
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
      const html = await renderEmailHtml(result.model, { showPending });
      if (!cancelled) setState({ status: "ready", log: result.log, html });
    })().catch(() => {
      if (!cancelled) setState({ status: "error", message: "No se pudo armar la vista previa de este correo." });
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, emailId, emailExists, showPending]);

  return (
    <main id="contenido" className="min-h-svh bg-bond-sand pt-[4.5rem] text-bond-night md:pt-24">
      <div className="container-editorial pb-6 pt-8 md:pt-10">
        <div className="mx-auto max-w-[40rem]">
          <p className="label-caps text-bond-olive">Vista previa · este correo no se envía</p>
          {state.status === "ready" ? (
            <dl data-testid="correo-barra" className="mt-5 grid gap-x-8 gap-y-2 text-sm md:grid-cols-[auto_1fr]">
              <dt className="label-caps self-center text-bond-olive">Para</dt>
              <dd data-testid="correo-para" className="min-w-0 break-words">
                {state.log.to}
              </dd>
              <dt className="label-caps self-center text-bond-olive">Asunto</dt>
              <dd data-testid="correo-asunto" className="min-w-0 break-words font-display text-xl">
                {state.log.subject}
              </dd>
              <dt className="label-caps self-center text-bond-olive">Fecha</dt>
              <dd className="min-w-0">{formatEcuadorDateTime(state.log.sentAt)}</dd>
            </dl>
          ) : (
            <p className="mt-5 text-lead text-bond-olive" aria-live="polite">
              {state.status === "loading" ? "Armando la vista previa…" : state.message}
            </p>
          )}
        </div>
      </div>

      <div className="container-editorial pb-12 pt-2 md:pb-20">
        {state.status === "ready" && <EmailFrame html={state.html} />}
        {state.status === "error" && (
          <div className="mx-auto max-w-xl py-10">
            <h1 className="display-serif text-display-m">
              Correo no <span className="accent-italic text-bond-ember">disponible</span>
            </h1>
            <Link href="/" className={`${buttonBase} ${buttonTones.olive} mt-8`}>
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
