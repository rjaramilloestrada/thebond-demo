import { Text } from "@react-email/components";
import { Block, bodyText, EditionFacts, Headline, Hero, HowToGet, IncludesList, Label, ScheduleTable, SectionTitle, Shell, Spacer, TicketCard } from "./parts";
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
          Hola {recipientName}, {many ? `tus ${tickets.length} entradas están listas` : "tu entrada está lista"}. Cada una tiene su QR único: en
          la puerta se escanea el de cada asistente.
        </Text>
        <Spacer height={8} />
        {tickets.map((t) => (
          <TicketCard key={t.code} ticket={t} />
        ))}
      </Block>
      <Block>
        <Label>La edición</Label>
        <SectionTitle>{edition.title}</SectionTitle>
        <EditionFacts edition={edition} />
      </Block>
      <Block>
        <Label>Cronograma</Label>
        <SectionTitle>El día, hora por hora</SectionTitle>
        <ScheduleTable schedule={edition.schedule} />
      </Block>
      <Block>
        <Label>Cómo llegar</Label>
        <SectionTitle>La sede</SectionTitle>
        <HowToGet edition={edition} />
      </Block>
      <Block>
        <Label>Your ticket includes</Label>
        <SectionTitle>Qué incluye</SectionTitle>
        <IncludesList includes={edition.includes} />
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
