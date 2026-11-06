import type { IncludeItem, ScheduleItem } from "@/domain/types";

/** Datos de la edición que muestran los correos. */
export interface EmailEdition {
  /** Enlace absoluto a la página de la edición */
  url: string;
  number: string;
  title: string;
  dateLabel: string;
  venueName: string;
  venueAddress: string;
  schedule: ScheduleItem[];
  includes: IncludeItem[];
}

/** Una entrada dentro de un correo, con su QR ya generado (data URL). */
export interface EmailTicket {
  index: number;
  total: number;
  attendeeName: string;
  ticketTypeName: string;
  /** Imagen PNG (data URL) del QR del token firmado */
  qrDataUrl: string;
  /** Enlace a "Mi entrada" con el token de esta versión */
  url: string;
  /** Identificador legible de la entrada, bajo el QR */
  code: string;
}

/** Datos comunes a todas las plantillas. */
export interface EmailBase {
  edition: EmailEdition;
  /** Prefijo de las imágenes de marca (`/email/…`): vacío en la vista previa; el origen del sitio en producción */
  assetBase: string;
  /** Nombre de quien recibe (saludo) */
  recipientName: string;
}
