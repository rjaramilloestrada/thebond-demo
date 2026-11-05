/** Latencia simulada de los adapters mock: 600 a 1 200 ms (brief 5.1). */
export const DEFAULT_LATENCY = { min: 600, max: 1200 } as const;

let range: { min: number; max: number } = { ...DEFAULT_LATENCY };

/** Solo para tests: permite acortar o anular la espera. */
export function configureLatency(next: { min: number; max: number }): void {
  range = next;
}

export function resetLatency(): void {
  range = { ...DEFAULT_LATENCY };
}

export function randomLatency(): number {
  const { min, max } = range;
  return Math.round(min + Math.random() * (max - min));
}

/** Espera una latencia aleatoria y devuelve los ms esperados. */
export async function simulateLatency(): Promise<number> {
  const ms = randomLatency();
  if (ms > 0) await new Promise<void>((resolve) => setTimeout(resolve, ms));
  return ms;
}
