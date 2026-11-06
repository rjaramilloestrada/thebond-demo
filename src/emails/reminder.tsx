import { Text } from "@react-email/components";
import { Block, bodyText, EditionFacts, Headline, Hero, HowToGet, Label, ScheduleTable, SectionTitle, Shell, Spacer, TicketCard } from "./parts";
import type { EmailBase, EmailTicket } from "./types";

export interface ReminderEmailProps extends EmailBase {
  ticket: EmailTicket;
}

/** Recordatorio "Tu bond es mañana": horario, sede y el QR para la puerta. */
export function ReminderEmail({ recipientName, edition, ticket, assetBase }: ReminderEmailProps) {
  return (
    <Shell preheader={`Mañana es ${edition.title}. Aquí tienes el horario y la sede.`} assetBase={assetBase}>
      <Hero tone="ember" eyebrow={`Edición ${edition.number} · ${edition.title}`}>
        <Headline lead="Tu bond es" accent="mañana." accentTone="night" />
      </Hero>
      <Block>
        <Text style={bodyText}>
          Hola {recipientName}, mañana nos vemos. Aquí están el horario y la sede, y tu QR para la puerta.
        </Text>
        <Spacer height={8} />
        <TicketCard ticket={ticket} />
      </Block>
      <Block>
        <Label>Horario</Label>
        <SectionTitle>Mañana, hora por hora</SectionTitle>
        <EditionFacts edition={edition} />
        <Spacer height={14} />
        <ScheduleTable schedule={edition.schedule} />
      </Block>
      <Block>
        <Label>Cómo llegar</Label>
        <SectionTitle>La sede</SectionTitle>
        <HowToGet edition={edition} />
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
