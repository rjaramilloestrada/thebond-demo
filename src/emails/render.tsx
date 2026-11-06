/**
 * Punto de entrada de las plantillas: un modelo por plantilla (`EmailModel`) y
 * `renderEmailHtml`, que devuelve el HTML completo del correo. Lo usa la vista
 * previa `/correo` (en el navegador) y los tests (en Node). `@react-email/render`
 * se importa aquí y este módulo solo se carga con `import()` dinámico desde la
 * vista previa: el resto del sitio no paga ese peso.
 */
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { PendingProvider } from "./parts";
import { ReminderEmail, type ReminderEmailProps } from "./reminder";
import { TicketEmail, type TicketEmailProps } from "./ticket";
import { TransferEmail, type TransferEmailProps } from "./transfer";
import { WaitlistAvailableEmail, type WaitlistEmailProps } from "./waitlist-available";

export type EmailModel =
  | { template: "ticket"; props: TicketEmailProps }
  | { template: "reminder"; props: ReminderEmailProps }
  | { template: "waitlist-available"; props: WaitlistEmailProps }
  | { template: "transfer"; props: TransferEmailProps };

export function emailElement(model: EmailModel): ReactElement {
  switch (model.template) {
    case "ticket":
      return <TicketEmail {...model.props} />;
    case "reminder":
      return <ReminderEmail {...model.props} />;
    case "waitlist-available":
      return <WaitlistAvailableEmail {...model.props} />;
    case "transfer":
      return <TransferEmail {...model.props} />;
  }
}

/**
 * HTML completo del correo. `showPending` sigue el modo presentación de la web:
 * apagado (por defecto), sin marcadores `[[PENDIENTE: …]]`; encendido, resaltados.
 */
export function renderEmailHtml(model: EmailModel, opts: { showPending?: boolean } = {}): Promise<string> {
  return render(<PendingProvider show={opts.showPending ?? false}>{emailElement(model)}</PendingProvider>);
}
