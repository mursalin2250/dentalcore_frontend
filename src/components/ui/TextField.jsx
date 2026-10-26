import { useId } from "react";

export const INPUT_CLASS =
  "h-10 w-full rounded-lg border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus-visible:border-primary focus-visible:outline-offset-0 sm:text-sm";

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
          className={`${INPUT_CLASS} ${error ? "border-danger" : "border-border"} ${endAdornment ? "pr-11" : ""}`}
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
