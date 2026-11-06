import { Text } from "@react-email/components";
import { Block, bodyText, EditionFacts, Headline, Hero, HowToGet, IncludesList, Label, ScheduleTable, Shell, Spacer, TicketCard } from "./parts";
import type { EmailBase, EmailTicket } from "./types";

export interface TicketEmailProps extends EmailBase {
  tickets: EmailTicket[];
}

/** Correo de entrada: un QR por asistente, datos de la edición, cronograma y cómo llegar. */
export function TicketEmail({ recipientName, edition, tickets, assetBase }: TicketEmailProps) {
  const many = tickets.length > 1;
  return (
    <Shell preheader={`Tu entrada a ${edition.title} está lista. Guarda tu QR.`} assetBase={assetBase}>
      <Hero eyebrow={`Edición ${edition.number} · ${edition.title}`}>
        <Headline lead="You’re" accent="in." />
      </Hero>
      <Block>
        <Text style={bodyText}>
          Hola {recipientName}, {many ? `tus ${tickets.length} entradas están listas` : "tu entrada está lista"}. Muestra el QR en la puerta.
        </Text>
        <Spacer height={8} />
        {tickets.map((t) => (
          <TicketCard key={t.code} ticket={t} />
        ))}
      </Block>
      <Block>
        <Label>La edición</Label>
        <EditionFacts edition={edition} />
      </Block>
      <Block>
        <Label>Cronograma</Label>
        <ScheduleTable schedule={edition.schedule} />
      </Block>
      <Block>
        <Label>Cómo llegar</Label>
        <HowToGet edition={edition} />
      </Block>
      <Block>
        <Label>Your ticket includes</Label>
        <IncludesList includes={edition.includes} />
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
