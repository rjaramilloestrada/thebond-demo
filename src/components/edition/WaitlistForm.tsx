"use client";

import { useId, useState, type FormEvent } from "react";
import { storage } from "@/adapters";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { isValidEmail } from "@/domain/validation";

type Status = "idle" | "saving" | "done" | "already";

/**
 * Lista de espera (brief 6.3): "Avísame si se libera un cupo". Valida nombre y
 * correo, agrega la entrada vía `StorageAdapter` y muestra un estado de éxito.
 * El aviso al cancelar una orden llega en la Fase 4.
 */
export function WaitlistForm({ editionId, tone = "dark" }: { editionId: string; tone?: "dark" | "light" }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [status, setStatus] = useState<Status>("idle");
  const [savedName, setSavedName] = useState("");

  const dark = tone === "dark";
  const labelCls = dark ? "text-bond-cream" : "text-bond-night";
  const fieldCls = dark
    ? "border-bond-cream/70 text-bond-cream"
    : "border-bond-night/70 text-bond-night";
  const errorCls = dark ? "text-bond-butter" : "text-bond-night";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: { name?: string; email?: string } = {};
    if (name.trim().length < 2) next.name = "Escribe tu nombre (mínimo 2 letras).";
    if (!isValidEmail(email)) next.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    setErrors(next);
    if (next.name || next.email) return;

    setStatus("saving");
    const normalized = email.trim().toLowerCase();
    const existing = await storage.waitlist.list();
    const duplicate = existing.some((w) => w.editionId === editionId && w.email.toLowerCase() === normalized);
    if (!duplicate) {
      await storage.waitlist.save({
        id: `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        editionId,
        name: name.trim(),
        email: normalized,
        createdAt: new Date().toISOString(),
        notifiedAt: null,
      });
    }
    setSavedName(name.trim());
    setStatus(duplicate ? "already" : "done");
  }

  if (status === "done" || status === "already") {
    return (
      <div role="status" className={`${labelCls} max-w-xl`}>
        <p className="display-serif text-heading">
          {status === "done" ? "Estás en la" : "Ya estabas en la"} <span className="accent-italic">lista.</span>
        </p>
        <p className="mt-4 text-lead">
          {savedName}, si se libera un cupo te avisamos al correo {email.trim()}.
        </p>
        <p className="mt-3 text-sm opacity-90">Es un demo: tu lugar queda guardado solo en este navegador.</p>
      </div>
    );
  }

  const saving = status === "saving";
  return (
    <form onSubmit={onSubmit} noValidate className={`${labelCls} grid max-w-xl gap-8`} aria-describedby={`${uid}-hint`}>
      <p id={`${uid}-hint`} className="text-lead">
        Déjanos tu nombre y tu correo. Si se libera un cupo, te avisamos primero.
      </p>
      <div>
        <label htmlFor={`${uid}-name`} className="label-caps">
          Nombre
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${uid}-name-error` : undefined}
          className={`mt-2 min-h-12 w-full border-0 border-b-2 bg-transparent px-0 py-2 text-lg ${fieldCls}`}
        />
        {errors.name && (
          <p id={`${uid}-name-error`} className={`mt-2 text-sm font-medium ${errorCls}`}>
            {errors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${uid}-email`} className="label-caps">
          Correo
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${uid}-email-error` : undefined}
          className={`mt-2 min-h-12 w-full border-0 border-b-2 bg-transparent px-0 py-2 text-lg ${fieldCls}`}
        />
        {errors.email && (
          <p id={`${uid}-email-error`} className={`mt-2 text-sm font-medium ${errorCls}`}>
            {errors.email}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving}
        className={`${buttonBase} ${dark ? buttonTones.butter : buttonTones.night} w-full sm:w-fit`}
      >
        {saving ? "Guardando…" : "Avísame si se libera un cupo"}
      </button>
    </form>
  );
}
