import { Text } from "@react-email/components";
import { Block, bodyText, CtaButton, EditionFacts, Headline, Hero, Label, PendingText, Shell, Spacer, WhenShowingPending } from "./parts";
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
          Hola {recipientName}, se liberó un cupo en {edition.title}. El cupo no queda apartado: es de quien complete su compra primero.
        </Text>
        <Spacer height={8} />
        <CtaButton href={`${edition.url}#entradas`}>Ver la edición</CtaButton>
        <Spacer height={12} />
        <WhenShowingPending>
          <Text style={{ ...bodyText, fontSize: 13, lineHeight: "20px" }}>
            <PendingText text="[[PENDIENTE: política de la lista de espera (tiempo que se aparta el cupo)]]" />
          </Text>
        </WhenShowingPending>
      </Block>
      <Block>
        <Label>La edición</Label>
        <EditionFacts edition={edition} />
        <Spacer height={28} />
      </Block>
    </Shell>
  );
}
