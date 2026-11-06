"use client";

import { useEffect, useRef } from "react";
import { formatClock, timerMilestone, useNow } from "./hooks";

/**
 * Contador de la reserva (brief 6.2, paso 2): una línea fina de progreso arriba
 * y un mm:ss pequeño. Un aviso para lectoras de pantalla (`aria-live`) solo
 * cambia cada minuto y en el último minuto. Al llegar a 0 llama `onExpire` una
 * sola vez, salvo que `paused` (hay un pago en curso).
 */
export function ReservationTimer({
  startedAt,
  expiresAt,
  onExpire,
  paused = false,
}: {
  startedAt: string;
  expiresAt: string;
  onExpire: () => void;
  paused?: boolean;
}) {
  const now = useNow(250);
  const total = Math.max(1, new Date(expiresAt).getTime() - new Date(startedAt).getTime());
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const ratio = Math.min(1, remaining / total);
  const lastMinute = remaining > 0 && remaining <= 60_000;
  const milestone = timerMilestone(remaining);

  const fired = useRef(false);
  useEffect(() => {
    if (remaining === 0 && !paused && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [remaining, paused, onExpire]);

  return (
    <div data-testid="reservation-timer" className="sticky top-0 z-30 bg-bond-cream/95 backdrop-blur-sm">
      <div className="progress-line h-0.5 w-full bg-bond-olive/20" aria-hidden>
        <span className={`block h-full origin-left ${lastMinute ? "bg-bond-ember" : "bg-bond-olive"}`} style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <div className="container-column flex items-center justify-end gap-3 py-2 text-bond-olive">
        <span className="label-caps !text-[0.625rem]">{lastMinute ? "Último minuto" : "Tu reserva"}</span>
        <time
          aria-hidden
          data-testid="timer-clock"
          dateTime={`PT${Math.ceil(remaining / 1000)}S`}
          className={`text-sm tabular-nums ${lastMinute ? "font-semibold text-bond-night" : ""}`}
        >
          {formatClock(remaining)}
        </time>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {milestone.text}
      </span>
    </div>
  );
}
