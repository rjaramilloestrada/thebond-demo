import { describe, expect, it } from "vitest";
import { isPending, pending, splitPending } from "./pending";

describe("pending", () => {
  it("genera el marcador con el formato del brief", () => {
    expect(pending("fecha")).toBe("[[PENDIENTE: fecha]]");
  });

  it("detecta marcadores sin estado compartido entre llamadas", () => {
    const text = pending("fecha de la ed. 002");
    // llamadas repetidas deben dar siempre el mismo resultado (bug de lastIndex)
    expect(isPending(text)).toBe(true);
    expect(isPending(text)).toBe(true);
    expect(splitPending(text)).toEqual([{ kind: "pending", description: "fecha de la ed. 002", raw: text }]);
    expect(isPending("25 OCT 2026")).toBe(false);
    expect(isPending(null)).toBe(false);
  });

  it("separa texto y marcadores", () => {
    const parts = splitPending(`ONNA · ${pending("dirección")} · fin`);
    expect(parts.map((p) => p.kind)).toEqual(["text", "pending", "text"]);
  });
});
