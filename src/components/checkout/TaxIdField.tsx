"use client";

import { TextField } from "@/components/ui/Field";

/**
 * Cédula (10 dígitos) o RUC (13) para la factura electrónica. Solo deja escribir
 * dígitos y detecta el tipo por la longitud; el error en español llega de
 * `validateTaxId` a través de `validateCheckoutForm`.
 */
export function TaxIdField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const detected =
    value.length === 10 ? "Cédula (10 dígitos)" : value.length === 13 ? "RUC (13 dígitos)" : `${value.length} de 10 (cédula) o 13 (RUC)`;
  return (
    <TextField
      id="taxid"
      fieldKey="taxId"
      label="Cédula o RUC"
      inputMode="numeric"
      autoComplete="off"
      maxLength={13}
      placeholder="Solo números"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 13))}
      onBlur={onBlur}
      error={error}
      hint={<span data-testid="taxid-kind">{detected}</span>}
    />
  );
}
