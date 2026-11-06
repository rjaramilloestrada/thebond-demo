"use client";

import { TextField } from "@/components/ui/Field";
import { fieldKey, type BuyerDraft } from "@/domain/checkout";

export function BuyerForm({
  value,
  onChange,
  errorFor,
  onBlurField,
}: {
  value: BuyerDraft;
  onChange: (next: BuyerDraft) => void;
  errorFor: (key: string) => string | undefined;
  onBlurField: (key: string) => void;
}) {
  const set = (patch: Partial<BuyerDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TextField
        id="buyer-name"
        fieldKey={fieldKey.buyer("name")}
        label="Nombre completo"
        autoComplete="name"
        value={value.name}
        onChange={(e) => set({ name: e.target.value })}
        onBlur={() => onBlurField(fieldKey.buyer("name"))}
        error={errorFor(fieldKey.buyer("name"))}
        className="md:col-span-2"
      />
      <TextField
        id="buyer-email"
        fieldKey={fieldKey.buyer("email")}
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value.email}
        onChange={(e) => set({ email: e.target.value })}
        onBlur={() => onBlurField(fieldKey.buyer("email"))}
        error={errorFor(fieldKey.buyer("email"))}
        hint="Aquí registramos tu orden."
      />
      <TextField
        id="buyer-phone"
        fieldKey={fieldKey.buyer("phone")}
        label="Teléfono"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        optional
        value={value.phone}
        onChange={(e) => set({ phone: e.target.value })}
        onBlur={() => onBlurField(fieldKey.buyer("phone"))}
        error={errorFor(fieldKey.buyer("phone"))}
      />
    </div>
  );
}
