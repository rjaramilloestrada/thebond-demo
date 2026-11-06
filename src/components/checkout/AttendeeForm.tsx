"use client";

import { Pending } from "@/components/Pending";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";
import { SelectField, TextField } from "@/components/ui/Field";
import { fieldKey, type AttendeeDraft } from "@/domain/checkout";
import type { AttendeeField, TicketType } from "@/domain/types";

/**
 * Un bloque por asistente: nombre, correo y los campos configurables de la
 * edición (`attendeeFields`: talla, nivel…). El primero ofrece "Usar mis datos".
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
}) {
  const n = index + 1;
  const setAnswer = (fieldId: string, answer: string) =>
    onChange({ ...value, answers: { ...value.answers, [fieldId]: answer } });
  return (
    <fieldset data-testid={`attendee-${index}`} className="paper-edge min-w-0 bg-bond-cream p-6 md:p-8">
      <legend className="sr-only">Asistente {n}</legend>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="display-serif text-heading">Asistente {n}</h3>
          {ticketType && (
            <p className="label-caps mt-2 text-bond-olive">
              <Pending text={ticketType.name} />
            </p>
          )}
        </div>
        {index === 0 && onUseBuyer && (
          <button
            type="button"
            onClick={onUseBuyer}
            disabled={!canUseBuyer}
            className={`${buttonBase} ${buttonTones.outlineLight} !min-h-12 !px-5 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Usar mis datos
          </button>
        )}
      </div>
      {index === 0 && onUseBuyer && !canUseBuyer && (
        <p className="mt-2 text-sm text-bond-olive">Completa tu nombre y correo arriba para copiarlos aquí.</p>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
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
    </fieldset>
  );
}
