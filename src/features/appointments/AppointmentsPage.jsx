import { useEffect, useMemo, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { APPOINTMENT_STATUS_META, APPOINTMENT_STATUSES } from "@/constants/appointments";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatShortDate, formatTime } from "@/lib/format";

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  ...Object.entries(APPOINTMENT_STATUS_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
];

const STATUS_OPTIONS = Object.entries(APPOINTMENT_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalDateInput(iso) {
  if (!iso) return dayKey(new Date());
  const d = new Date(iso);
  return dayKey(d);
}

function toLocalTimeInput(iso) {
  if (!iso) return "09:00";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "09:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm || 0, 0, 0).toISOString();
}

function AppointmentFormDialog({ open, appointment, patients, doctors, defaultDay, onClose, onSaved }) {
  const isEdit = Boolean(appointment);
  const form = useForm({
    initialValues: {
      patient: "",
      doctor: "",
      date: defaultDay || dayKey(new Date()),
      time: "09:00",
      reason: "",
      status: APPOINTMENT_STATUSES.SCHEDULED,
      note: "",
    },
    validate: (v) => {
      const e = {};
      if (!v.patient) e.patient = "Select a patient.";
      if (!v.doctor) e.doctor = "Select a doctor.";
      if (!v.date) e.date = "Pick a date.";
      if (!v.time) e.time = "Pick a time.";
      return e;
    },
    onSubmit: async (values) => {
      const body = {
        patient: values.patient,
        doctor: values.doctor,
        startsAt: combineDateTime(values.date, values.time),
        reason: values.reason.trim(),
        status: values.status,
      };
      if (values.note?.trim()) body.note = values.note.trim();
      if (isEdit) {
        await api(API_ENDPOINTS.appointment(appointment.id), { method: HTTP_METHODS.PATCH, body });
      } else {
        await api(API_ENDPOINTS.APPOINTMENTS, { method: HTTP_METHODS.POST, body });
      }
      onSaved();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    if (appointment) {
      form.reset({
        patient: appointment.patient?.id || "",
        doctor: appointment.doctor?.id || "",
        date: toLocalDateInput(appointment.startsAt),
        time: toLocalTimeInput(appointment.startsAt),
        reason: appointment.reason || "",
        status: appointment.status || APPOINTMENT_STATUSES.SCHEDULED,
        note: "",
      });
    } else {
      form.reset({
        patient: "",
        doctor: "",
        date: defaultDay || dayKey(new Date()),
        time: "09:00",
        reason: "",
        status: APPOINTMENT_STATUSES.SCHEDULED,
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, defaultDay]);

  if (!open) return null;

  const patientOptions = [
    { value: "", label: "Select patient" },
    ...patients.map((p) => ({ value: p.id, label: p.name })),
  ];
  const doctorOptions = [
    { value: "", label: "Select doctor" },
    ...doctors.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit appointment" : "New appointment"} className="max-w-md">
      <form onSubmit={form.handleSubmit} className="space-y-3">
        <SelectField label="Patient" options={patientOptions} {...form.getFieldProps("patient")} />
        <SelectField label="Doctor" options={doctorOptions} {...form.getFieldProps("doctor")} />
        <div className="grid grid-cols-2 gap-3">
          <DateField label="Date" {...form.getFieldProps("date")} />
          <TextField label="Time" type="time" {...form.getFieldProps("time")} />
        </div>
        <TextField label="Reason" {...form.getFieldProps("reason")} />
        <SelectField label="Status" options={STATUS_OPTIONS} {...form.getFieldProps("status")} />
        {isEdit && <TextField label="Add note" {...form.getFieldProps("note")} />}
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function AppointmentsPage() {
  usePageTitle("Appointments");
  const today = useMemo(() => dayKey(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => monthKey(new Date()));
  const [selectedDay, setSelectedDay] = useState(today);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [dayRows, setDayRows] = useState([]);
  const [monthRows, setMonthRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [formState, setFormState] = useState({ open: false, appointment: null });
  const search = useDebouncedValue(query, 300).trim();

  const calendarDays = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const startPad = first.getDay();
    const lastDate = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i += 1) cells.push(null);
    for (let d = 1; d <= lastDate; d += 1) cells.push(dayKey(new Date(y, m - 1, d)));
    return cells;
  }, [viewMonth]);

  const monthCounts = useMemo(() => {
    const map = {};
    for (const row of monthRows) {
      if (!row.startsAt) continue;
      const k = dayKey(new Date(row.startsAt));
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [monthRows]);

  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      api(API_ENDPOINTS.DOCTORS, { params: { limit: 100 }, signal: c.signal }),
      api(API_ENDPOINTS.PATIENTS, { params: { limit: 100 }, signal: c.signal }),
    ])
      .then(([d, p]) => {
        setDoctors(d.doctors || []);
        setPatients(p.patients || []);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    const c = new AbortController();
    const [y, m] = viewMonth.split("-").map(Number);
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    api(API_ENDPOINTS.APPOINTMENTS, {
      params: { from, to, limit: 200, page: 1 },
      signal: c.signal,
    })
      .then((list) => setMonthRows(list.appointments || []))
      .catch(() => {
        if (!c.signal.aborted) setMonthRows([]);
      });
    return () => c.abort();
  }, [viewMonth, reloadKey]);

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    const [y, m] = viewMonth.split("-").map(Number);
    const monthFrom = new Date(y, m - 1, 1).toISOString();
    const monthTo = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    Promise.all([
      api(API_ENDPOINTS.APPOINTMENTS, {
        params: {
          search: search || undefined,
          status: status || undefined,
          doctor: doctorId || undefined,
          from: fromDate ? new Date(fromDate).toISOString() : monthFrom,
          to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : monthTo,
          page,
          limit: 12,
        },
        signal: c.signal,
      }),
      api(API_ENDPOINTS.APPOINTMENTS_STATS, { params: { date: selectedDay }, signal: c.signal }),
    ])
      .then(([list, st]) => {
        setRows(list.appointments || []);
        setPagination(list.pagination || { page: 1, pages: 1, total: 0 });
        setStats(st);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [search, status, doctorId, fromDate, toDate, page, viewMonth, selectedDay, reloadKey]);

  useEffect(() => {
    const c = new AbortController();
    setDayLoading(true);
    const start = parseDay(selectedDay);
    const from = new Date(start);
    from.setHours(0, 0, 0, 0);
    const to = new Date(start);
    to.setHours(23, 59, 59, 999);
    api(API_ENDPOINTS.APPOINTMENTS, {
      params: { from: from.toISOString(), to: to.toISOString(), limit: 100 },
      signal: c.signal,
    })
      .then((list) => {
        setDayRows(
          (list.appointments || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
        );
      })
      .catch(() => {
        if (!c.signal.aborted) setDayRows([]);
      })
      .finally(() => {
        if (!c.signal.aborted) setDayLoading(false);
      });
    return () => c.abort();
  }, [selectedDay, reloadKey]);

  const shiftMonth = (delta) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  };

  const doctorOptions = [
    { value: "", label: "All doctors" },
    ...doctors.map((d) => ({ value: d.id, label: d.name })),
  ];

  const monthLabel = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [viewMonth]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Book, reschedule and track patient visits.</p>
        </div>
        <Button onClick={() => setFormState({ open: true, appointment: null })}>
          <Plus className="size-4" /> New appointment
        </Button>
      </div>

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Today", stats.todayTotal],
            ["Pending", stats.pending],
            ["Completed", stats.completed],
            ["Doctors present", stats.doctorsPresentToday],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4 shadow-card">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex h-[22rem] flex-col rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className="rounded-lg p-1.5 hover:bg-surface-muted" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <CaretLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold">{monthLabel}</p>
            <button type="button" className="rounded-lg p-1.5 hover:bg-surface-muted" onClick={() => shiftMonth(1)} aria-label="Next month">
              <CaretRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1 font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid flex-1 grid-cols-7 content-start gap-1">
            {calendarDays.map((key, i) =>
              key ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(key)}
                  className={`relative rounded-lg py-2 text-sm tabular-nums transition-colors ${
                    key === selectedDay
                      ? "bg-primary text-primary-foreground"
                      : key === today
                        ? "bg-primary-soft text-foreground"
                        : "hover:bg-surface-muted"
                  }`}
                >
                  {Number(key.slice(-2))}
                  {monthCounts[key] ? (
                    <span
                      className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${
                        key === selectedDay ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  ) : null}
                </button>
              ) : (
                <div key={`pad-${i}`} />
              ),
            )}
          </div>
        </div>

        <div className="flex h-[22rem] flex-col rounded-xl border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Day schedule</h2>
              <p className="text-xs text-muted-foreground">{formatShortDate(selectedDay)}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-2 text-xs"
              onClick={() => setFormState({ open: true, appointment: null })}
            >
              <Plus className="size-3.5" /> Book
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {dayLoading && (
              <div className="space-y-2" aria-busy="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!dayLoading && dayRows.length === 0 && (
              <div className="grid h-full place-items-center px-4 text-center">
                <div>
                  <p className="text-sm font-medium">No visits this day</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick another date or book a new appointment for this day.
                  </p>
                </div>
              </div>
            )}
            {!dayLoading &&
              dayRows.map((row) => {
                const meta = APPOINTMENT_STATUS_META[row.status] || { label: row.status, tone: "neutral" };
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setDetail(row)}
                    className="mb-2 w-full rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{row.patient?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.startsAt ? formatTime(row.startsAt) : "—"} · {row.doctor?.name || "—"}
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-md">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${INPUT_CLASS} border-border pl-9`}
            placeholder="Search patient or doctor…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label="Status"
          hideLabel
          className="w-full sm:w-40"
          options={STATUS_FILTER}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
        <SelectField
          label="Doctor"
          hideLabel
          className="w-full sm:w-48"
          options={doctorOptions}
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
            setPage(1);
          }}
        />
        <DateField
          label="From"
          hideLabel
          className="w-full sm:w-40"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />
        <DateField
          label="To"
          hideLabel
          className="w-full sm:w-40"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState
            icon={WarningCircle}
            title="Could not load appointments"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      )}

      {!error && loading && (
        <div className="mt-6 space-y-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!error && !loading && rows.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="No appointments"
            description="Book a visit to see it on the calendar and list."
            action={
              <Button onClick={() => setFormState({ open: true, appointment: null })}>
                <Plus className="size-4" /> New appointment
              </Button>
            }
          />
        </div>
      )}

      {!error && !loading && rows.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const meta = APPOINTMENT_STATUS_META[row.status] || { label: row.status, tone: "neutral" };
                  return (
                    <tr key={row.id} className="hover:bg-surface-muted/60">
                      <td className="px-4 py-3 font-medium">
                        <button type="button" className="text-left hover:underline" onClick={() => setDetail(row)}>
                          {row.patient?.name || "—"}
                        </button>
                      </td>
                      <td className="px-4 py-3">{row.doctor?.name || "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{row.startsAt ? formatShortDate(row.startsAt) : "—"}</td>
                      <td className="px-4 py-3 tabular-nums">{row.startsAt ? formatTime(row.startsAt) : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 px-2 text-xs"
                          onClick={() => setFormState({ open: true, appointment: row })}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            total={pagination.total}
            onPageChange={setPage}
            itemLabel="appointments"
          />
        </>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} title="Appointment details" className="max-w-md">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-medium">{detail.patient?.name || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Doctor</span>
              <span>{detail.doctor?.name || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">When</span>
              <span className="tabular-nums">
                {detail.startsAt ? `${formatShortDate(detail.startsAt)} · ${formatTime(detail.startsAt)}` : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Status</span>
              <Badge tone={(APPOINTMENT_STATUS_META[detail.status] || {}).tone || "neutral"}>
                {(APPOINTMENT_STATUS_META[detail.status] || {}).label || detail.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="mt-0.5">{detail.reason || "—"}</p>
            </div>
            {detail.originalStartAt && (
              <div>
                <p className="text-muted-foreground">Originally scheduled</p>
                <p className="mt-0.5 tabular-nums">
                  {formatShortDate(detail.originalStartAt)} · {formatTime(detail.originalStartAt)}
                </p>
              </div>
            )}
            {(detail.notes || []).length > 0 && (
              <div>
                <p className="mb-1 text-muted-foreground">Notes</p>
                <ul className="space-y-2">
                  {[...detail.notes].reverse().map((n) => (
                    <li key={n.id || n.createdAt} className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2">
                      <p>{n.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.createdBy || "Staff"} · {n.createdAt ? formatShortDate(n.createdAt) : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormState({ open: true, appointment: detail });
                  setDetail(null);
                }}
              >
                Edit
              </Button>
              <Button type="button" variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <AppointmentFormDialog
        open={formState.open}
        appointment={formState.appointment}
        patients={patients}
        doctors={doctors}
        defaultDay={selectedDay}
        onClose={() => setFormState({ open: false, appointment: null })}
        onSaved={reload}
      />
    </div>
  );
}
