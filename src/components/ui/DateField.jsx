import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { INPUT_CLASS } from "./TextField";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** value is YYYY-MM-DD or "". Display is always dd/mm/yyyy. */
export function toDisplayDate(isoDate) {
  if (!isoDate || isoDate.length < 10) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function parseDisplayDate(text) {
  const cleaned = text.trim().replace(/[-.]/g, "/");
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function buildGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DateField({
  label,
  value = "",
  onChange,
  error,
  name,
  className = "",
  disabled = false,
}) {
  const id = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(toDisplayDate(value));
  const initial = value && value.length >= 10 ? new Date(`${value.slice(0, 10)}T12:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    setDraft(toDisplayDate(value));
    if (value && value.length >= 10) {
      const d = new Date(`${value.slice(0, 10)}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const cells = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const title = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  const commitText = () => {
    if (!draft.trim()) {
      onChange?.({ target: { name, value: "" } });
      return;
    }
    const parsed = parseDisplayDate(draft);
    if (parsed) {
      onChange?.({ target: { name, value: parsed } });
      setDraft(toDisplayDate(parsed));
    } else {
      setDraft(toDisplayDate(value));
    }
  };

  const pickDay = (day) => {
    const pad = (n) => String(n).padStart(2, "0");
    const next = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onChange?.({ target: { name, value: next } });
    setDraft(toDisplayDate(next));
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className={className} ref={rootRef}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          disabled={disabled}
          value={draft}
          aria-invalid={Boolean(error)}
          aria-expanded={open}
          aria-haspopup="dialog"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitText}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText();
              setOpen(false);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className={`${INPUT_CLASS} border-border pr-10 ${error ? "border-danger" : ""}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Open calendar"
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarBlank className="size-4" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={label || "Choose date"}
            className="absolute z-30 mt-1 w-[18.5rem] rounded-xl border border-border bg-surface p-3 shadow-popover"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
              >
                <CaretLeft className="size-4" />
              </button>
              <p className="text-sm font-medium">{title}</p>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
              >
                <CaretRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="h-8" />;
                const pad = (n) => String(n).padStart(2, "0");
                const key = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
                const selected = value?.slice(0, 10) === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={`h-8 rounded-lg text-sm tabular-nums transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-surface-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-text">{error}</p>}
    </div>
  );
}
