import { describe, expect, it } from "vitest";
import { cedulaCheckDigit, isValidCedula, isValidRuc, validateTaxId } from "./validation";

describe("cédula ecuatoriana (10 dígitos, módulo 10)", () => {
  it("acepta una cédula con dígito verificador correcto", () => {
    expect(isValidCedula("1710034065")).toBe(true);
  });

  it("rechaza si el dígito verificador no coincide", () => {
    expect(isValidCedula("1710034064")).toBe(false);
    expect(isValidCedula("1710034066")).toBe(false);
  });

  it("calcula el dígito verificador", () => {
    expect(cedulaCheckDigit("171003406")).toBe(5);
  });

  it("rechaza provincia inválida y tercer dígito ≥ 6", () => {
    expect(isValidCedula("9910034065")).toBe(false);
    expect(isValidCedula("0010034065")).toBe(false);
    expect(isValidCedula("1760034065")).toBe(false);
  });

  it("rechaza largo incorrecto y caracteres no numéricos", () => {
    expect(isValidCedula("171003406")).toBe(false);
    expect(isValidCedula("17100340655")).toBe(false);
    expect(isValidCedula("17100340a5")).toBe(false);
  });
});

describe("RUC ecuatoriano (13 dígitos)", () => {
  it("persona natural: cédula válida + establecimiento 001", () => {
    expect(isValidRuc("1710034065001")).toBe(true);
    expect(isValidRuc("1710034065000")).toBe(false);
    expect(isValidRuc("1710034064001")).toBe(false);
  });

  it("sociedad privada (3er dígito 9, módulo 11)", () => {
    expect(isValidRuc("1790011674001")).toBe(true);
    expect(isValidRuc("1790011675001")).toBe(false);
    expect(isValidRuc("1790011674000")).toBe(false);
  });

  it("entidad pública (3er dígito 6, módulo 11)", () => {
    expect(isValidRuc("1760001550001")).toBe(true);
    expect(isValidRuc("1760001560001")).toBe(false);
  });

  it("rechaza largo incorrecto y tercer dígito 7 u 8", () => {
    expect(isValidRuc("171003406500")).toBe(false);
    expect(isValidRuc("1770034065001")).toBe(false);
  });
});

describe("validateTaxId", () => {
  it("clasifica cédula y RUC válidos", () => {
    expect(validateTaxId("1710034065")).toEqual({ valid: true, kind: "cedula" });
    expect(validateTaxId(" 1790011674001 ")).toEqual({ valid: true, kind: "ruc" });
  });

  it("da mensajes claros en español", () => {
    const empty = validateTaxId("");
    expect(empty.valid).toBe(false);
    const letters = validateTaxId("17100abc65");
    expect(!letters.valid && letters.message).toMatch(/solo números/i);
    const bad = validateTaxId("1710034060");
    expect(!bad.valid && bad.kind).toBe("cedula");
    const len = validateTaxId("12345");
    expect(!len.valid && len.message).toMatch(/10 dígitos/);
  });
});
