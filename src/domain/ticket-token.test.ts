import { describe, expect, it } from "vitest";
import { createTicketToken, verifyTicketToken } from "./ticket-token";

describe("token QR firmado", () => {
  it("firma y verifica", async () => {
    const token = await createTicketToken("tk-001", 1);
    expect(await verifyTicketToken(token)).toEqual({ ticketId: "tk-001", version: 1 });
  });

  it("la versión nueva produce un token distinto (transferencia)", async () => {
    const v1 = await createTicketToken("tk-001", 1);
    const v2 = await createTicketToken("tk-001", 2);
    expect(v1).not.toBe(v2);
    expect((await verifyTicketToken(v2))?.version).toBe(2);
  });

  it("rechaza firmas alteradas y formatos inválidos", async () => {
    const token = await createTicketToken("tk-001", 1);
    const [id, , sig] = token.split(".");
    expect(await verifyTicketToken(`${id}.2.${sig}`)).toBeNull();
    expect(await verifyTicketToken(`${token}x`)).toBeNull();
    expect(await verifyTicketToken("hola")).toBeNull();
    expect(await verifyTicketToken("")).toBeNull();
  });
});
