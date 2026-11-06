"use client";

import { Pending } from "@/components/Pending";
import { SelectField, TextField } from "@/components/ui/Field";
import { fieldKey, type AttendeeDraft } from "@/domain/checkout";
import type { AttendeeField, TicketType } from "@/domain/types";

/**
 * Un bloque colapsable por asistente: nombre, correo y los campos configurables
 * de la edición (`attendeeFields`: talla, nivel…). El resumen muestra el nombre,
 * el tipo de entrada y si ya está completo. El primero ofrece "Usar mis datos".
 */
export function AttendeeForm({
  index,
  ticketType,
  fields,
  value,
  onChange,
  errorFor,
  onBlurField,
  onUseBuyer,
  canUseBuyer,
  open,
  onOpenChange,
  complete,
}: {
  index: number;
  ticketType: TicketType | undefined;
  fields: readonly AttendeeField[];
  value: AttendeeDraft;
  onChange: (next: AttendeeDraft) => void;
  errorFor: (key: string) => string | undefined;
  onBlurField: (key: string) => void;
  onUseBuyer?: () => void;
  canUseBuyer?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complete: boolean;
}) {
  const n = index + 1;
  const setAnswer = (fieldId: string, answer: string) =>
    onChange({ ...value, answers: { ...value.answers, [fieldId]: answer } });
  return (
    <details
      data-testid={`attendee-${index}`}
      open={open}
      onToggle={(e) => onOpenChange(e.currentTarget.open)}
      className="border-b border-bond-night/20"
    >
      <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-3">
        <span className="min-w-0">
          <span className="block truncate font-display text-xl">{value.name.trim() || `Asistente ${n}`}</span>
          {ticketType && (
            <span className="label-caps mt-1 block text-bond-olive">
              <Pending text={ticketType.name} />
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {complete && (
            <svg aria-label="Completo" role="img" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="m5 10.5 3.2 3.2L15 6.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span aria-hidden className="details-plus text-xl leading-none transition-transform duration-[var(--dur-base)]">
            +
          </span>
        </span>
      </summary>
      <div className="grid gap-6 pb-8 pt-2">
        {index === 0 && onUseBuyer && (
          <div>
            <button
              type="button"
              onClick={onUseBuyer}
              disabled={!canUseBuyer}
              className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              Usar mis datos
            </button>
          </div>
        )}
        <TextField
          id={`att-${index}-name`}
          fieldKey={fieldKey.attendee(index, "name")}
          label="Nombre completo"
          autoComplete="off"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          onBlur={() => onBlurField(fieldKey.attendee(index, "name"))}
          error={errorFor(fieldKey.attendee(index, "name"))}
        />
        <TextField
          id={`att-${index}-email`}
          fieldKey={fieldKey.attendee(index, "email")}
          label="Correo"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          onBlur={() => onBlurField(fieldKey.attendee(index, "email"))}
          error={errorFor(fieldKey.attendee(index, "email"))}
          hint="Aquí llega su entrada."
        />
        {fields.map((f) => {
          const key = fieldKey.answer(index, f.id);
          const common = {
            id: `att-${index}-f-${f.id}`,
            fieldKey: key,
            label: f.label,
            optional: !f.required,
            value: value.answers[f.id] ?? "",
            error: errorFor(key),
          };
          return f.type === "select" ? (
            <SelectField
              key={f.id}
              {...common}
              options={f.options}
              onChange={(e) => setAnswer(f.id, e.target.value)}
              onBlur={() => onBlurField(key)}
            />
          ) : (
            <TextField
              key={f.id}
              {...common}
              autoComplete="off"
              onChange={(e) => setAnswer(f.id, e.target.value)}
              onBlur={() => onBlurField(key)}
            />
          );
        })}
      </div>
    </details>
  );
}
