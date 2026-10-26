import { useId } from "react";
import { INPUT_CLASS } from "./TextField";

/** Date input styled like other fields. Value is YYYY-MM-DD. */
export default function DateField({ label, error, hideLabel = false, className = "", ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium"}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        aria-invalid={Boolean(error)}
        className={`${INPUT_CLASS} ${error ? "border-danger" : "border-border"}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
