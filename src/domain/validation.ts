/**
 * Validación de identificación tributaria de Ecuador (brief 6.2, paso 3):
 * cédula de 10 dígitos y RUC de 13 dígitos.
 *
 * Referencias de algoritmo:
 * - Cédula: 2 dígitos de provincia (01–24 o 30), tercer dígito < 6, dígito
 *   verificador por módulo 10 con coeficientes 2,1,2,1,2,1,2,1,2.
 * - RUC persona natural (3er dígito < 6): cédula válida + establecimiento ≥ 001.
 * - RUC sociedad privada (3er dígito 9): módulo 11, coef. 4,3,2,7,6,5,4,3,2,
 *   verificador en la posición 10; establecimiento ≥ 001.
 * - RUC entidad pública (3er dígito 6): módulo 11, coef. 3,2,7,6,5,4,3,2,
 *   verificador en la posición 9; establecimiento ≥ 0001.
 */

export type TaxIdKind = "cedula" | "ruc";

export type TaxIdResult =
  | { valid: true; kind: TaxIdKind }
  | { valid: false; kind: TaxIdKind | null; message: string };

const ONLY_DIGITS = /^\d+$/;

function provinceOk(value: string): boolean {
  const province = Number(value.slice(0, 2));
  return (province >= 1 && province <= 24) || province === 30;
}

export function cedulaCheckDigit(first9: string): number {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = Number(first9[i]) * (i % 2 === 0 ? 2 : 1);
    if (product > 9) product -= 9;
    sum += product;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidCedula(value: string): boolean {
  if (value.length !== 10 || !ONLY_DIGITS.test(value)) return false;
  if (!provinceOk(value)) return false;
  if (Number(value[2]) >= 6) return false;
  return cedulaCheckDigit(value.slice(0, 9)) === Number(value[9]);
}

function mod11CheckDigit(digits: string, coefficients: number[]): number {
  let sum = 0;
  for (let i = 0; i < coefficients.length; i++) sum += Number(digits[i]) * coefficients[i];
  const remainder = sum % 11;
  return remainder === 0 ? 0 : 11 - remainder;
}

export function isValidRuc(value: string): boolean {
  if (value.length !== 13 || !ONLY_DIGITS.test(value)) return false;
  if (!provinceOk(value)) return false;
  const third = Number(value[2]);

  if (third < 6) {
    return isValidCedula(value.slice(0, 10)) && Number(value.slice(10)) >= 1;
  }
  if (third === 9) {
    return (
      mod11CheckDigit(value, [4, 3, 2, 7, 6, 5, 4, 3, 2]) === Number(value[9]) &&
      Number(value.slice(10)) >= 1
    );
  }
  if (third === 6) {
    return (
      mod11CheckDigit(value, [3, 2, 7, 6, 5, 4, 3, 2]) === Number(value[8]) &&
      Number(value.slice(9)) >= 1
    );
  }
  return false;
}

/** Valida cédula (10 dígitos) o RUC (13 dígitos) con un mensaje claro en español. */
export function validateTaxId(input: string): TaxIdResult {
  const value = input.trim();
  if (!value) return { valid: false, kind: null, message: "Escribe tu cédula o RUC." };
  if (!ONLY_DIGITS.test(value)) {
    return { valid: false, kind: null, message: "Usa solo números, sin espacios ni guiones." };
  }
  if (value.length === 10) {
    return isValidCedula(value)
      ? { valid: true, kind: "cedula" }
      : { valid: false, kind: "cedula", message: "La cédula no es válida. Revisa los 10 dígitos." };
  }
  if (value.length === 13) {
    return isValidRuc(value)
      ? { valid: true, kind: "ruc" }
      : { valid: false, kind: "ruc", message: "El RUC no es válido. Revisa los 13 dígitos." };
  }
  return {
    valid: false,
    kind: null,
    message: "La cédula tiene 10 dígitos y el RUC tiene 13.",
  };
}
