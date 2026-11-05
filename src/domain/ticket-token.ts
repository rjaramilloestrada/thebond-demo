/**
 * Token QR firmado (demo). En producción lo firma el servidor; aquí se simula
 * con HMAC-SHA256 de Web Crypto sobre `ticketId.version`. Transferir una entrada
 * sube la versión, así que el QR anterior deja de ser válido.
 *
 * Formato: `<ticketId>.<version>.<firma base64url>`
 */

/** Secreto de DEMO. No protege nada real. */
const DEMO_SECRET = "thebond-demo-no-es-un-secreto";
const SIGNATURE_BYTES = 12;

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto no está disponible en este entorno.");
  return c;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const c = getCrypto();
  const enc = new TextEncoder();
  const key = await c.subtle.importKey(
    "raw",
    enc.encode(DEMO_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await c.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(new Uint8Array(mac).slice(0, SIGNATURE_BYTES));
}

export async function createTicketToken(ticketId: string, version: number): Promise<string> {
  const payload = `${ticketId}.${version}`;
  return `${payload}.${await sign(payload)}`;
}

export interface ParsedToken {
  ticketId: string;
  version: number;
}

/** Devuelve los datos del token si la firma es correcta; `null` si no. */
export async function verifyTicketToken(token: string): Promise<ParsedToken | null> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  const [ticketId, versionText, signature] = parts;
  const version = Number(versionText);
  if (!ticketId || !Number.isInteger(version) || version < 1) return null;
  const expected = await sign(`${ticketId}.${version}`);
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0 ? { ticketId, version } : null;
}
