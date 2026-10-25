import { useEffect, useId, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { INPUT_CLASS } from "./TextField";

// Custom listbox styled like TextField — no native browser menu chrome.
export default function SelectField({
  label,
  options,
  error,
  hideLabel = false,
  className = "",
  value,
  onChange,
  name,
  disabled = false,
  ...props
}) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selected = options.find((o) => String(o.value) === String(value));
  const labelText = selected?.label ?? "Select…";

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => String(o.value) === String(value));
    setHighlight(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  const pick = (option) => {
    onChange?.({ target: { name, value: option.value } });
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[highlight]) pick(options[highlight]);
    }
  };

  return (
    <div className={className} ref={rootRef}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium"}>
        {label}
      </label>
      <div className="relative">
        <input type="hidden" name={name} value={value ?? ""} readOnly />
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(error)}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className={`${INPUT_CLASS} flex cursor-pointer items-center justify-between gap-2 border-border text-left ${error ? "border-danger" : ""} ${disabled ? "opacity-60" : ""}`}
          {...props}
        >
          <span className="truncate">{labelText}</span>
          <CaretDown size={16} className="shrink-0 text-muted-foreground" />
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-popover"
          >
            {options.map((option, index) => (
              <li key={String(option.value)} role="option" aria-selected={String(option.value) === String(value)}>
                <button
                  type="button"
                  className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                    index === highlight ? "bg-primary-soft text-foreground" : "hover:bg-surface-muted"
                  } ${String(option.value) === String(value) ? "font-medium" : ""}`}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-text">{error}</p>}
    </div>
  );
}
