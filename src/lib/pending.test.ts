import { describe, expect, it } from "vitest";
import { allPending, anyData, hasData, isPending, pending, splitPending, stripPending } from "./pending";

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

  it("hasData distingue datos reales de pendientes y vacíos", () => {
    expect(hasData("25 OCT 2026")).toBe(true);
    expect(hasData(pending("fecha"))).toBe(false);
    expect(hasData(`Murano Plaza · ${pending("dirección")}`)).toBe(false);
    expect(hasData("")).toBe(false);
    expect(hasData(null)).toBe(false);
  });

  it("stripPending quita marcadores y separadores colgantes", () => {
    expect(stripPending(pending("fecha"))).toBe("");
    expect(stripPending(`Murano Plaza, Guayaquil · ${pending("dirección exacta")}`)).toBe("Murano Plaza, Guayaquil");
    expect(stripPending(`${pending("a")} · ONNA`)).toBe("ONNA");
    expect(stripPending("ONNA")).toBe("ONNA");
    expect(stripPending(undefined)).toBe("");
  });

  it("allPending y anyData agrupan varios valores", () => {
    expect(allPending([pending("a"), pending("b")])).toBe(true);
    expect(allPending([pending("a"), "ONNA"])).toBe(false);
    expect(anyData([pending("a"), `Murano · ${pending("b")}`])).toBe(true);
    expect(anyData([pending("a"), ""])).toBe(false);
  });
});
