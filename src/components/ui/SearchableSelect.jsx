import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { INPUT_CLASS } from "./TextField";

/**
 * Accessible combobox: type to filter options, keyboard support.
 * options: [{ value, label }]
 */
export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Search…",
  emptyLabel = "No matches",
  className = "",
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) pick(filtered[highlight]);
    }
  };

  return (
    <div className={className} ref={rootRef}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(error)}
          className={`${INPUT_CLASS} flex cursor-pointer items-center justify-between gap-2 border-border text-left ${error ? "border-danger" : ""}`}
          onClick={() => {
            setOpen((o) => !o);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          onKeyDown={onKeyDown}
        >
          <span className={selected ? "truncate" : "truncate text-muted-foreground"}>
            {selected ? selected.label : placeholder}
          </span>
          <CaretDown size={16} className="shrink-0 text-muted-foreground" />
        </button>

        {open && (
          <div
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-popover"
            role="presentation"
          >
            <div className="relative border-b border-border p-2">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`${INPUT_CLASS} border-border pl-9`}
                aria-autocomplete="list"
                aria-controls={listId}
              />
            </div>
            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              className="max-h-56 overflow-y-auto py-1"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</li>
              )}
              {filtered.map((option, index) => (
                <li key={option.value === "" ? "__empty" : option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                      index === highlight ? "bg-primary-soft text-foreground" : "hover:bg-surface-muted"
                    } ${option.value === value ? "font-medium" : ""}`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-text">{error}</p>}
    </div>
  );
}
