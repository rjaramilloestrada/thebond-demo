"use client";

import { useEffect, useState } from "react";

/** Reloj que se actualiza cada `intervalMs`. Solo úsalo después de hidratar. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Hito del temporizador para anunciarlo a lectoras de pantalla: cambia cada
 * minuto y en el último minuto (60, 30 y 10 s) para no repetir cada segundo.
 */
export function timerMilestone(remainingMs: number): { bucket: number; text: string } {
  const sec = Math.ceil(remainingMs / 1000);
  if (sec <= 0) return { bucket: 0, text: "La reserva venció y se liberaron los cupos." };
  if (sec <= 10) return { bucket: 10, text: "Quedan 10 segundos de reserva." };
  if (sec <= 30) return { bucket: 30, text: "Quedan 30 segundos de reserva." };
  if (sec <= 60) return { bucket: 60, text: "Queda 1 minuto de reserva." };
  const minutes = Math.ceil(sec / 60);
  return { bucket: 100 + minutes, text: `Te quedan ${minutes} minutos de reserva.` };
}
