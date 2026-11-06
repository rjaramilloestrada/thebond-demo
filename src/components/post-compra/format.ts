/** Fechas y horas en la zona de Ecuador (UTC-5), en español. */
const ZONE = "America/Guayaquil";

export function formatEcuadorDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "long", timeStyle: "short", timeZone: ZONE }).format(d);
}

export function formatEcuadorDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "long", timeZone: ZONE }).format(d);
}

/** Origen del sitio con su subruta (`https://…/thebond-demo`): base de enlaces e imágenes en los correos. */
export function currentSiteUrl(basePath: string): string {
  return `${window.location.origin}${basePath}`;
}
