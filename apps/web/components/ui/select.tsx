import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({ label, options, id, className, ...props }: SelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? props.name ?? generatedId;
  return (
    <label className="field" htmlFor={selectId}>
      {label ? <span className="field-label">{label}</span> : null}
      <select id={selectId} className={`select ${className ?? ""}`.trim()} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
