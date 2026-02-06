import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <input id={inputId} className={`input ${error ? "input-error" : ""} ${className ?? ""}`.trim()} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
