"use client";

import type { ChangeEventHandler, FocusEventHandler, HTMLInputAutoCompleteAttribute, ReactNode } from "react";

/**
 * Campos de formulario accesibles sobre fondo claro: `label` visible, ayuda,
 * `aria-invalid` + `aria-describedby` con el error en línea. El error va en texto
 * night con un ícono (el ember queda solo como borde): contraste AA.
 */

export function ErrorIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="8.2" />
      <path d="M10 5.5v5.2M10 13.6v.1" strokeLinecap="round" />
    </svg>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-sm font-medium text-bond-night">
      <ErrorIcon />
      <span>{children}</span>
    </p>
  );
}

const inputBase =
  "mt-1 min-h-12 w-full border-0 border-b-2 bg-transparent px-0 py-2 text-lg text-bond-night placeholder:text-bond-olive disabled:cursor-not-allowed disabled:opacity-60";

function borderFor(error?: string): string {
  return error ? "border-bond-ember" : "border-bond-night/70";
}

interface BaseProps {
  id: string;
  label: string;
  /** Clave del campo para enfocarlo al fallar la validación */
  fieldKey?: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

function describedBy(id: string, hint: ReactNode, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function TextField({
  id,
  label,
  fieldKey,
  hint,
  error,
  optional,
  disabled,
  className = "",
  value,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  placeholder,
  name,
}: BaseProps & {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: HTMLInputAutoCompleteAttribute;
  maxLength?: number;
  placeholder?: string;
  name?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label-caps text-bond-olive">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal">(opcional)</span>}
      </label>
      <input
        id={id}
        name={name ?? id}
        data-field={fieldKey}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputBase} ${borderFor(error)}`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-bond-olive">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

export function SelectField({
  id,
  label,
  fieldKey,
  hint,
  error,
  optional,
  disabled,
  className = "",
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Elige una opción",
}: BaseProps & {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  onBlur?: FocusEventHandler<HTMLSelectElement>;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label-caps text-bond-olive">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal">(opcional)</span>}
      </label>
      <select
        id={id}
        name={id}
        data-field={fieldKey}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputBase} ${borderFor(error)} cursor-pointer rounded-none`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-bond-olive">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
