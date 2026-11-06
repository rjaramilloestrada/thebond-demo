import { Text } from "@react-email/components";
import { Block, bodyText, CtaButton, EditionFacts, Headline, Hero, Label, PendingText, SectionTitle, Shell, Spacer } from "./parts";
import type { EmailBase } from "./types";

export type WaitlistEmailProps = EmailBase;

/** Aviso a la lista de espera: se liberó un cupo y el enlace a la edición. */
export function WaitlistAvailableEmail({ recipientName, edition, assetBase }: WaitlistEmailProps) {
  return (
    <Shell preheader={`Se liberó un cupo en ${edition.title}.`} assetBase={assetBase}>
      <Hero eyebrow={`Edición ${edition.number} · ${edition.title}`}>
        <Headline lead="Se liberó un" accent="cupo." />
      </Hero>
      <Block>
        <Text style={bodyText}>
          Hola {recipientName}, estabas en la lista de espera y se liberó un cupo en {edition.title}. Te avisamos primero, en el orden en
          que te anotaste.
        </Text>
        <Text style={bodyText}>
          El cupo no queda apartado: se asigna a quien complete su compra primero, así que entra cuanto antes.
        </Text>
        <Spacer height={8} />
        <CtaButton href={`${edition.url}#entradas`}>Ver la edición</CtaButton>
        <Spacer height={12} />
        <Text style={{ ...bodyText, fontSize: 13, lineHeight: "20px" }}>
          <PendingText text="[[PENDIENTE: política de la lista de espera (tiempo que se aparta el cupo)]]" />
        </Text>
      </Block>
      <Block>
        <Label>La edición</Label>
        <SectionTitle>{edition.title}</SectionTitle>
        <EditionFacts edition={edition} />
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
