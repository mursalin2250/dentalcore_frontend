import { useId } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { INPUT_CLASS } from "./TextField";

// Native <select> (keyboard + screen reader support for free), styled to match.
export default function SelectField({ label, options, error, hideLabel = false, className = "", ...props }) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium"}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`${INPUT_CLASS} cursor-pointer appearance-none pr-9 ${error ? "border-danger" : "border-border"}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-text">{error}</p>}
    </div>
  );
}
