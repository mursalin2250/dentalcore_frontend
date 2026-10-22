import { useId } from "react";

// Subtle default border; soft accent ring on focus (matches light + dark).
export const INPUT_CLASS =
  "h-10 w-full rounded-lg border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 hover:border-muted-foreground/30 focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm";

// Label + input + inline error/hint, wired together with aria attributes.
export default function TextField({ label, error, hint, endAdornment, className = "", ...props }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`${INPUT_CLASS} ${error ? "border-danger focus-visible:ring-danger/20" : "border-border"} ${endAdornment ? "pr-11" : ""}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</div>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          aria-live="polite"
          className={`mt-1.5 text-sm ${error ? "text-danger-text" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
