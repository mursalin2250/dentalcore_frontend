import { useId } from "react";
import { CaretDown } from "@phosphor-icons/react";
import DateField, { toDisplayDate } from "./DateField";
import { INPUT_CLASS } from "./TextField";

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Split ISO datetime into local YYYY-MM-DD and HH:mm for editing. */
export function splitLocalDateTime(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function joinLocalDateTime(date, time) {
  if (!date) return "";
  const t = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "09:00";
  const d = new Date(`${date}T${t}:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));
const MINUTES = ["00", "15", "30", "45"];

/**
 * Custom date + time controls. Value is ISO string (or local datetime string).
 * onChange receives { target: { name, value } } with ISO string.
 */
export default function DateTimeField({ label, value, onChange, error, name, className = "" }) {
  const id = useId();
  const { date, time } = splitLocalDateTime(value);
  const [hh, mm] = (time || "09:00").split(":");

  const emit = (nextDate, nextTime) => {
    const iso = joinLocalDateTime(nextDate, nextTime);
    onChange?.({ target: { name, value: iso } });
  };

  return (
    <div className={className}>
      {label && (
        <p className="mb-1.5 text-sm font-medium" id={`${id}-label`}>
          {label}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-labelledby={`${id}-label`}>
        <DateField
          label="Date"
          value={date}
          onChange={(e) => emit(e.target.value, time || "09:00")}
          error={error && !date ? error : undefined}
        />
        <div>
          <span className="mb-1.5 block text-sm font-medium">Time</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                aria-label="Hour"
                value={hh || "09"}
                onChange={(e) => emit(date, `${e.target.value}:${mm || "00"}`)}
                className={`${INPUT_CLASS} cursor-pointer appearance-none border-border pr-8`}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative flex-1">
              <select
                aria-label="Minute"
                value={MINUTES.includes(mm) ? mm : "00"}
                onChange={(e) => emit(date, `${hh || "09"}:${e.target.value}`)}
                className={`${INPUT_CLASS} cursor-pointer appearance-none border-border pr-8`}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-text">{error}</p>}
      {date && (
        <p className="mt-1.5 text-xs text-muted-foreground">{toDisplayDate(date)} · {hh}:{mm}</p>
      )}
    </div>
  );
}
