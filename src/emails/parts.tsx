/**
 * Piezas compartidas de las plantillas de correo. Todo el estilo va en línea y
 * con tablas (lo que entienden los clientes de correo); los colores salen de
 * `theme.ts`. El copy escrito por IGNIS está pendiente de aprobar por la clienta
 * (PENDIENTES.md).
 */
import { Body, Button, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { splitPending, stripPending } from "@/lib/pending";
import { color, font, FONTS_STYLESHEET, WIDTH } from "./theme";
import type { EmailBase, EmailEdition, EmailTicket } from "./types";

/* ───────── Texto ───────── */

/**
 * Modo presentación de la web (`showPending`): apagado, los correos no traen
 * marcadores `[[PENDIENTE: …]]`; encendido, salen resaltados igual que en el sitio.
 */
const ShowPendingContext = createContext(false);

export function PendingProvider({ show, children }: { show: boolean; children: ReactNode }) {
  return <ShowPendingContext.Provider value={show}>{children}</ShowPendingContext.Provider>;
}

/** Contenido que solo existe con los pendientes visibles (notas de "falta confirmar"). */
export function WhenShowingPending({ children }: { children: ReactNode }) {
  return useContext(ShowPendingContext) ? <>{children}</> : null;
}

/** Marcadores `[[PENDIENTE: …]]` resaltados, igual que en la web (o ocultos si el modo presentación está apagado). */
export function PendingText({ text, dash = false }: { text: string; dash?: boolean }) {
  const show = useContext(ShowPendingContext);
  if (!show) {
    const clean = stripPending(text);
    return <>{clean || (dash ? "—" : null)}</>;
  }
  return (
    <>
      {splitPending(text).map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <span
            key={i}
            data-pending={seg.description}
            style={{
              backgroundColor: color.butter,
              color: color.night,
              fontFamily: font.body,
              fontStyle: "normal",
              fontSize: "0.85em",
              fontWeight: 500,
              padding: "1px 6px",
              borderRadius: 2,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            {seg.raw}
          </span>
        ),
      )}
    </>
  );
}

export const labelStyle: CSSProperties = {
  margin: 0,
  fontFamily: font.label,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "16px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
};

export function Label({ children, tone = "olive" }: { children: ReactNode; tone?: "olive" | "night" | "cream" | "sand" | "butter" }) {
  return <Text style={{ ...labelStyle, color: color[tone] }}>{children}</Text>;
}

const displayStyle: CSSProperties = {
  margin: 0,
  fontFamily: font.display,
  fontWeight: 400,
  textTransform: "uppercase",
  letterSpacing: "-0.01em",
};

/** Titular serif en mayúsculas con una palabra en itálica de acento. */
export function Headline({
  lead,
  accent,
  tone = "cream",
  accentTone = "butter",
  size = 44,
}: {
  lead: string;
  accent: string;
  tone?: "cream" | "night";
  accentTone?: "butter" | "ember" | "cream" | "night";
  size?: number;
}) {
  return (
    <Heading as="h1" className="bond-h1" style={{ ...displayStyle, fontSize: size, lineHeight: `${Math.round(size * 1.05)}px`, color: color[tone] }}>
      {lead} <em style={{ fontStyle: "italic", textTransform: "none", color: color[accentTone] }}>{accent}</em>
    </Heading>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h2"
      style={{ ...displayStyle, fontSize: 28, lineHeight: "30px", color: color.night, margin: "6px 0 0" }}
    >
      {children}
    </Heading>
  );
}

export const bodyText: CSSProperties = {
  margin: "0 0 14px",
  fontFamily: font.body,
  fontSize: 16,
  lineHeight: "26px",
  color: color.night,
};

/* ───────── Estructura ───────── */

export function Shell({
  preheader,
  assetBase,
  children,
}: {
  preheader: string;
  assetBase: string;
  children: ReactNode;
}) {
  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <link rel="stylesheet" href={FONTS_STYLESHEET} />
        <style>{`@media only screen and (max-width: 480px) { .bond-pad { padding-left: 20px !important; padding-right: 20px !important; } .bond-h1 { font-size: 36px !important; line-height: 38px !important; } }`}</style>
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: "24px 0", backgroundColor: color.sand, fontFamily: font.body }}>
        <Container style={{ width: "100%", maxWidth: WIDTH, margin: "0 auto", backgroundColor: color.cream }}>
          <Section style={{ backgroundColor: color.olive, padding: "28px 0 24px", textAlign: "center" }}>
            <Img
              src={`${assetBase}/email/monograma-butter.png`}
              alt="THE BOND"
              width={84}
              height={52}
              style={{ display: "block", margin: "0 auto", border: 0 }}
            />
            <Text style={{ ...labelStyle, color: color.cream, margin: "14px 0 0", textAlign: "center" }}>A wellness community</Text>
          </Section>
          {children}
          <Section className="bond-pad" style={{ backgroundColor: color.olive, padding: "36px 32px 30px", textAlign: "center" }}>
            <Img
              src={`${assetBase}/email/logo-cream.png`}
              alt="THE BOND, a wellness community"
              width={150}
              height={94}
              style={{ display: "block", margin: "0 auto", border: 0 }}
            />
            <Text style={{ margin: "22px 0 0", fontFamily: font.display, fontSize: 22, lineHeight: "28px", color: color.cream, textAlign: "center" }}>
              See you in the next <em style={{ color: color.butter }}>bond.</em>
            </Text>
            <WhenShowingPending>
              <Text style={{ margin: "18px 0 0", fontFamily: font.body, fontSize: 12, lineHeight: "18px", color: color.cream, textAlign: "center" }}>
                Contacto: <PendingText text="[[PENDIENTE: correo de contacto de THE BOND]]" />
              </Text>
            </WhenShowingPending>
            <Text style={{ margin: "14px 0 0", fontFamily: font.body, fontSize: 12, lineHeight: "18px", color: color.cream, textAlign: "center" }}>
              Demo · datos simulados. Este correo no se envía a nadie.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Hero({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <Section className="bond-pad" style={{ backgroundColor: color.olive, padding: "44px 32px 40px" }}>
      {eyebrow && <Label tone="cream">{eyebrow}</Label>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </Section>
  );
}

export function Block({ children, tone = "cream" }: { children: ReactNode; tone?: "cream" | "sand" }) {
  return (
    <Section className="bond-pad" style={{ backgroundColor: color[tone], padding: "32px 32px 8px" }}>
      {children}
    </Section>
  );
}

export function CtaButton({ href, children, tone = "night" }: { href: string; children: ReactNode; tone?: "night" | "butter" }) {
  return (
    <Button
      href={href}
      target="_blank"
      style={{
        display: "inline-block",
        backgroundColor: tone === "night" ? color.night : color.butter,
        color: tone === "night" ? color.butter : color.night,
        fontFamily: font.label,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "16px 28px",
        borderRadius: 2,
      }}
    >
      {children}
    </Button>
  );
}

/* ───────── Contenido de edición ───────── */

/** Tarjeta de una entrada: asistente, tipo, botón a "Mi entrada" y su QR. */
export function TicketCard({ ticket, cta = "Ver mi entrada" }: { ticket: EmailTicket; cta?: string }) {
  return (
    <Section style={{ margin: "0 0 18px", backgroundColor: color.cream, border: `1px solid ${color.night}`, borderRadius: 2 }}>
      <Row>
        <Column style={{ padding: "22px 8px 22px 22px", verticalAlign: "top" }}>
          <Label tone="olive">
            Entrada {ticket.index} de {ticket.total}
          </Label>
          <Text style={{ ...displayStyle, margin: "10px 0 0", fontSize: 24, lineHeight: "26px", color: color.night }}>{ticket.attendeeName}</Text>
          <Text style={{ margin: "8px 0 16px", fontFamily: font.body, fontSize: 14, lineHeight: "20px", color: color.olive }}>
            <PendingText text={ticket.ticketTypeName} />
          </Text>
          <Link
            href={ticket.url}
            target="_blank"
            style={{ fontFamily: font.label, fontSize: 11, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: color.night, textDecoration: "underline" }}
          >
            {cta}
          </Link>
        </Column>
        <Column width={150} style={{ width: 150, padding: "18px 18px 14px 4px", verticalAlign: "top", textAlign: "center" }}>
          <Img
            src={ticket.qrDataUrl}
            alt={`Código QR de la entrada de ${ticket.attendeeName}`}
            width={128}
            height={128}
            data-qr={ticket.code}
            style={{ display: "block", margin: "0 auto", border: 0 }}
          />
          <Text style={{ margin: "6px 0 0", fontFamily: font.body, fontSize: 11, lineHeight: "14px", color: color.olive, textAlign: "center" }}>{ticket.code}</Text>
        </Column>
      </Row>
    </Section>
  );
}

const factLabel: CSSProperties = { ...labelStyle, color: color.olive, padding: "10px 12px 10px 0", verticalAlign: "top", width: 96 };
const factValue: CSSProperties = { fontFamily: font.body, fontSize: 16, lineHeight: "24px", color: color.night, padding: "8px 0", verticalAlign: "top" };

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Row style={{ borderTop: `1px solid ${color.sand}` }}>
      <Column style={factLabel}>{label}</Column>
      <Column style={factValue}>{children}</Column>
    </Row>
  );
}

/** Fecha, sede y dirección de la edición. */
export function EditionFacts({ edition }: { edition: EmailEdition }) {
  return (
    <Section style={{ margin: "8px 0 0", borderBottom: `1px solid ${color.sand}` }}>
      <Fact label="Fecha">
        <PendingText text={edition.dateLabel} dash />
      </Fact>
      <Fact label="Sede">
        <PendingText text={edition.venueName} dash />
      </Fact>
      <Fact label="Dirección">
        <PendingText text={edition.venueAddress} dash />
      </Fact>
    </Section>
  );
}

/** Cronograma: hora | actividad. */
export function ScheduleTable({ schedule }: { schedule: EmailEdition["schedule"] }) {
  return (
    <Section style={{ margin: "10px 0 0", borderBottom: `1px solid ${color.sand}` }}>
      {schedule.map((item, i) => (
        <Row key={i} style={{ borderTop: `1px solid ${color.sand}` }}>
          <Column style={{ width: 84, padding: "10px 12px 10px 0", verticalAlign: "top", fontFamily: font.display, fontSize: 20, lineHeight: "26px", color: color.night }}>
            <PendingText text={item.time} dash />
          </Column>
          <Column style={{ padding: "11px 0", verticalAlign: "top", fontFamily: font.body, fontSize: 16, lineHeight: "24px", color: color.night }}>
            <PendingText text={item.title} dash />
          </Column>
        </Row>
      ))}
    </Section>
  );
}

/** Cómo llegar: sede, dirección e indicaciones (pendientes hasta tener el dato). */
export function HowToGet({ edition }: { edition: EmailEdition }) {
  return (
    <>
      <Text style={{ ...bodyText, margin: "10px 0 6px" }}>
        <strong style={{ fontWeight: 600 }}>
          <PendingText text={edition.venueName} dash />
        </strong>
        <br />
        <PendingText text={edition.venueAddress} />
      </Text>
      <WhenShowingPending>
        <Text style={{ ...bodyText, color: color.olive, fontSize: 14, lineHeight: "22px" }}>
          <PendingText text="[[PENDIENTE: indicaciones para llegar y estacionamiento]]" /> · <PendingText text="[[PENDIENTE: enlace al mapa de la sede]]" />
        </Text>
      </WhenShowingPending>
    </>
  );
}

/** "Your ticket includes": las cuatro piezas de la entrada. */
export function IncludesList({ includes }: { includes: EmailEdition["includes"] }) {
  return (
    <Section style={{ margin: "10px 0 0", borderBottom: `1px solid ${color.sand}` }}>
      {includes.map((inc) => (
        <Row key={inc.id} style={{ borderTop: `1px solid ${color.sand}` }}>
          <Column style={{ padding: "12px 0" }}>
            <Text style={{ ...labelStyle, color: color.night }}>{inc.title}</Text>
            <Text style={{ margin: "4px 0 0", fontFamily: font.body, fontSize: 15, lineHeight: "22px", color: color.olive }}>{inc.description}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function Spacer({ height = 24 }: { height?: number }) {
  return <div style={{ height, lineHeight: `${height}px`, fontSize: 1 }}>&nbsp;</div>;
}

export type { EmailBase };
