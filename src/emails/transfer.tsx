import { Text } from "@react-email/components";
import type { TransferInfo } from "@/domain/types";
import { Block, bodyText, CtaButton, EditionFacts, Headline, Hero, HowToGet, Label, ScheduleTable, Shell, Spacer, TicketCard } from "./parts";
import type { EmailBase, EmailTicket } from "./types";

export interface TransferEmailProps extends EmailBase {
  transfer: TransferInfo;
  /** Solo para quien recibe: su entrada con el QR nuevo */
  ticket?: EmailTicket;
}

/**
 * Transferencia: a quien recibe, su entrada con el QR nuevo; a quien la tenía,
 * el aviso de que el QR anterior ya no vale.
 */
export function TransferEmail({ transfer, ticket, edition, assetBase }: TransferEmailProps) {
  if (transfer.role === "previous-holder") {
    return (
      <Shell preheader={`Tu entrada a ${edition.title} ahora es de ${transfer.toName}.`} assetBase={assetBase}>
        <Hero eyebrow={`Edición ${edition.number} · ${edition.title}`}>
          <Headline lead="Entrada" accent="transferida." />
        </Hero>
        <Block>
          <Text style={bodyText}>
            Hola {transfer.fromName}, tu entrada a {edition.title} ahora es de {transfer.toName} ({transfer.toEmail}).
          </Text>
          <Text style={bodyText}>
            Tu QR anterior ya no es válido: en la puerta se rechazará. {transfer.toName} recibió una entrada con un QR nuevo.
          </Text>
          <Spacer height={8} />
          <CtaButton href={edition.url}>Ver la edición</CtaButton>
        </Block>
        <Block>
          <Label>La edición</Label>
          <EditionFacts edition={edition} />
          <Spacer height={28} />
        </Block>
      </Shell>
    );
  }
  return (
    <Shell preheader={`${transfer.fromName} te transfirió una entrada a ${edition.title}.`} assetBase={assetBase}>
      <Hero eyebrow={`Edición ${edition.number} · ${edition.title}`}>
        <Headline lead="Te dieron un" accent="lugar." />
      </Hero>
      <Block>
        <Text style={bodyText}>
          Hola {transfer.toName}, {transfer.fromName} te transfirió su entrada a {edition.title}. Este es tu QR: el anterior ya no
          funciona.
        </Text>
        <Spacer height={8} />
        {ticket && <TicketCard ticket={ticket} />}
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
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
