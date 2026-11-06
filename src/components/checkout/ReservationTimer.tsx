"use client";

import { useEffect, useRef } from "react";
import { formatClock, timerMilestone, useNow } from "./hooks";

/**
 * Contador de la reserva (brief 6.2, paso 2): mm:ss visible, barra de progreso y
 * un aviso para lectoras de pantalla (`aria-live`) que solo cambia cada minuto y
 * en el último minuto. Al llegar a 0 llama `onExpire` una sola vez, salvo que
 * `paused` (hay un pago en curso).
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
    <div
      data-testid="reservation-timer"
      className="surface-dark sticky top-0 z-30 border-y border-bond-cream/20 bg-bond-night text-bond-cream"
    >
      <div className="container-editorial flex items-center justify-between gap-4 py-3">
        <p className="label-caps text-bond-sand">
          {lastMinute ? "Último minuto" : "Reservamos tu lugar por"}
        </p>
        <p className="flex items-baseline gap-2">
          <time
            aria-hidden
            data-testid="timer-clock"
            dateTime={`PT${Math.ceil(remaining / 1000)}S`}
            className={`font-display text-3xl leading-none tabular-nums ${lastMinute ? "text-bond-butter" : "text-bond-cream"}`}
          >
            {formatClock(remaining)}
          </time>
          <span className="label-caps text-bond-sand">minutos</span>
        </p>
      </div>
      <div className="h-1 w-full bg-bond-cream/20" aria-hidden>
        <div className="h-full origin-left bg-bond-butter" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {milestone.text}
      </span>
    </div>
  );
}
