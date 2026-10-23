import { useEffect, useMemo, useState } from "react";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  NotePencil,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import DateField from "@/components/ui/DateField";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  APPOINTMENT_DIALOGS,
  APPOINTMENT_MESSAGES,
  APPOINTMENT_STAT_CARDS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_STATUS_TONES,
  APPOINTMENT_TEXT,
  DOCTOR_FILTER_ALL,
  SEARCH_DEBOUNCE_MS,
  STATUS_FILTER_ALL,
} from "@/constants/appointments";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatLongDate, formatNumber, formatShortDate, formatTime } from "@/lib/format";
import AppointmentDetailsDialog from "./AppointmentDetailsDialog";
import AppointmentFormDialog from "./AppointmentFormDialog";
import {
  monthKey,
  todayKey,
  useAppointmentCalendar,
  useAppointmentStats,
  useAppointments,
  useDayAppointments,
} from "./useAppointments";

function NotesDialog({ open, appointment, onAdd, onClose }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const notes = appointment?.notes || [];
  useEffect(() => {
    if (open) {
      setText("");
      setError("");
    }
  }, [open]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onAdd(text.trim());
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={APPOINTMENT_TEXT.NOTES} description={appointment?.patient?.name || ""} className="max-w-md">
      <ul className="mb-4 max-h-56 space-y-3 overflow-y-auto">
        {notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg bg-surface-muted/60 px-3 py-2">
            <p className="text-sm">{n.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[n.createdBy?.name, n.createdAt ? formatShortDate(n.createdAt) : null, n.createdAt ? formatTime(n.createdAt) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="space-y-3">
        <TextField label={APPOINTMENT_TEXT.ADD_NOTE} value={text} onChange={(e) => setText(e.target.value)} />
        {error && <FormError>{error}</FormError>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="submit" loading={loading} disabled={!text.trim()}>{APPOINTMENT_TEXT.ADD_NOTE}</Button>
        </div>
      </form>
    </Dialog>
  );
}


function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarMonth({ month, selectedKey, counts, onSelect, onPrev, onNext, isLoading }) {
  const [y, m] = month.split("-").map(Number);
  const cells = useMemo(() => buildMonthGrid(y, m - 1), [y, m]);
  const today = todayKey();
  const title = new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  return (
    <section className="flex h-[28rem] max-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{APPOINTMENT_TEXT.CALENDAR}</h2>
        <div className="flex items-center gap-1">
          <IconButton label={APPOINTMENT_TEXT.PREV_MONTH} onClick={onPrev}><CaretLeft className="size-4" /></IconButton>
          <span className="min-w-[8rem] text-center text-sm font-medium">{title}</span>
          <IconButton label={APPOINTMENT_TEXT.NEXT_MONTH} onClick={onNext}><CaretRight className="size-4" /></IconButton>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground" role="row">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} role="columnheader">{d}</div>
        ))}
      </div>
      {isLoading ? (
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-1" role="grid" aria-label={title}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="h-14" />;
            const key = `${month}-${String(day).padStart(2, "0")}`;
            const count = counts[key] || 0;
            const isSelected = key === selectedKey;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${key}${count ? `, ${count} appointments` : ""}`}
                onClick={() => onSelect(key)}
                className={`flex h-14 flex-col items-center justify-center rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary-soft text-foreground"
                    : isToday
                      ? "border-primary/40 bg-surface-muted"
                      : "border-transparent hover:bg-surface-muted"
                }`}
              >
                <span className="font-medium tabular-nums">{day}</span>
                {count > 0 && (
                  <span className="mt-0.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function AppointmentsPage() {
  usePageTitle(APPOINTMENT_TEXT.LIST_TITLE);
  const [month, setMonth] = useState(() => monthKey());
  const [selectedDay, setSelectedDay] = useState(() => todayKey());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [doctorFilter, setDoctorFilter] = useState(DOCTOR_FILTER_ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [doctorOptions, setDoctorOptions] = useState([{ value: DOCTOR_FILTER_ALL, label: APPOINTMENT_TEXT.DOCTOR_FILTER }]);
  const [dialog, setDialog] = useState({ type: null, appointment: null });
  const [announcement, setAnnouncement] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const statsState = useAppointmentStats(todayKey());
  const calendarState = useAppointmentCalendar(month);
  const dayState = useDayAppointments(selectedDay);
  const listState = useAppointments({
    search,
    status: statusFilter,
    doctor: doctorFilter,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    page,
  });

  useEffect(() => {
    const c = new AbortController();
    api(`${API_ENDPOINTS.DOCTORS}?limit=50`, { signal: c.signal })
      .then((data) => {
        setDoctorOptions([
          { value: DOCTOR_FILTER_ALL, label: APPOINTMENT_TEXT.DOCTOR_FILTER },
          ...(data.doctors || []).map((d) => ({ value: d.id, label: d.name })),
        ]);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    if (!listState.isLoading && page > listState.pagination.totalPages) setPage(listState.pagination.totalPages);
  }, [listState.isLoading, page, listState.pagination.totalPages]);

  const refetchAll = () => {
    statsState.reload();
    calendarState.reload();
    dayState.reload();
    listState.reload();
  };

  const shiftMonth = (delta) => {
    const [y, m] = month.split("-").map(Number);
    setMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  };

  const handleCreate = async (values) => {
    await listState.createAppointment(values);
    setAnnouncement(APPOINTMENT_MESSAGES.CREATED);
    setDialog({ type: null });
    refetchAll();
  };
  const handleEdit = async (values) => {
    await listState.updateAppointment(dialog.appointment.id, values);
    setAnnouncement(APPOINTMENT_MESSAGES.UPDATED);
    setDialog({ type: null });
    refetchAll();
  };
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await listState.removeAppointment(dialog.appointment.id);
      setAnnouncement(APPOINTMENT_MESSAGES.DELETED);
      setDialog({ type: null });
      refetchAll();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleAddNote = async (text) => {
    const result = await listState.addNote(dialog.appointment.id, text);
    setDialog({ type: APPOINTMENT_DIALOGS.NOTES, appointment: result.appointment });
    setAnnouncement(APPOINTMENT_MESSAGES.NOTE_ADDED);
    dayState.reload();
    listState.refresh();
  };

  const statusOptions = [
    { value: STATUS_FILTER_ALL, label: APPOINTMENT_TEXT.STATUS_FILTER },
    ...APPOINTMENT_STATUS_OPTIONS,
  ];

  let selectedLabel = selectedDay;
  try {
    selectedLabel = formatLongDate(new Date(`${selectedDay}T12:00:00+06:00`));
  } catch {
    /* keep key */
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{APPOINTMENT_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APPOINTMENT_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <Button onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.ADD })}>
          <Plus /> {APPOINTMENT_TEXT.ADD}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {APPOINTMENT_STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            index={i + 1}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            isLoading={statsState.isLoading}
            value={statsState.stats ? formatNumber(statsState.stats[card.key] ?? 0) : undefined}
          />
        ))}
      </div>
      {statsState.error && (
        <div className="mt-3">
          <EmptyState icon={WarningCircle} title="Could not load stats" description={statsState.error.message}
            action={<Button variant="secondary" onClick={statsState.reload}>Try again</Button>} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="flex h-[28rem] max-h-[28rem] flex-col lg:col-span-2">
          <CalendarMonth
            month={month}
            selectedKey={selectedDay}
            counts={calendarState.days}
            isLoading={calendarState.isLoading}
            onSelect={setSelectedDay}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
          />
          {calendarState.error && (
            <div className="mt-3">
              <EmptyState icon={WarningCircle} title="Could not load calendar" description={calendarState.error.message}
                action={<Button variant="secondary" onClick={calendarState.reload}>Try again</Button>} />
            </div>
          )}
        </div>
        <section className="flex h-[28rem] max-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <h2 className="shrink-0 text-base font-semibold tracking-tight">{APPOINTMENT_TEXT.DAY_PANEL}</h2>
          <p className="mt-0.5 shrink-0 text-sm text-muted-foreground">{selectedLabel}</p>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
            {dayState.error && (
              <EmptyState icon={WarningCircle} title="Could not load day" description={dayState.error.message}
                action={<Button variant="secondary" onClick={dayState.reload}>Try again</Button>} />
            )}
            {!dayState.error && dayState.isLoading && (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            )}
            {!dayState.error && !dayState.isLoading && dayState.items.length === 0 && (
              <div className="grid h-full place-items-center">
                <EmptyState
                  compact
                  icon={CalendarBlank}
                  title={APPOINTMENT_TEXT.EMPTY_DAY_TITLE}
                  description={APPOINTMENT_TEXT.EMPTY_DAY_DESCRIPTION}
                  action={
                    <Button
                      className="h-9 px-3"
                      onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.ADD })}
                    >
                      <Plus className="size-4" />
                      {APPOINTMENT_TEXT.EMPTY_DAY_ACTION}
                    </Button>
                  }
                />
              </div>
            )}
            {!dayState.error && !dayState.isLoading && dayState.items.length > 0 && (
              <ul className="divide-y divide-border border-t border-border">
                {dayState.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.DETAILS, appointment: item })}
                      className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.patient?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {[formatTime(item.startsAt), item.doctor?.name].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Badge tone={APPOINTMENT_STATUS_TONES[item.status] || "neutral"}>
                        {APPOINTMENT_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <label htmlFor="appt-search" className="sr-only">{APPOINTMENT_TEXT.SEARCH_LABEL}</label>
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="appt-search"
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={APPOINTMENT_TEXT.SEARCH_PLACEHOLDER}
              className={`${INPUT_CLASS} border-border pl-9`}
            />
          </div>
          <SelectField label="" hideLabel options={statusOptions} value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full sm:w-40" />
          <SelectField label="" hideLabel options={doctorOptions} value={doctorFilter}
            onChange={(e) => { setDoctorFilter(e.target.value); setPage(1); }} className="w-full sm:w-44" />
          <DateField label={APPOINTMENT_TEXT.FROM} value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-full sm:w-40" />
          <DateField label={APPOINTMENT_TEXT.TO} value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-full sm:w-40" />
        </div>

        {listState.error && (
          <div className="mt-4">
            <EmptyState icon={WarningCircle} title="Could not load appointments" description={listState.error.message}
              action={<Button variant="secondary" onClick={listState.reload}>Try again</Button>} />
          </div>
        )}
        {!listState.error && listState.isLoading && (
          <div className="mt-4 space-y-2" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        )}
        {!listState.error && !listState.isLoading && listState.appointments.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={WarningCircle}
              title={search || statusFilter !== STATUS_FILTER_ALL ? APPOINTMENT_TEXT.EMPTY_FILTER_TITLE : APPOINTMENT_TEXT.EMPTY_TITLE}
              description={search || statusFilter !== STATUS_FILTER_ALL ? APPOINTMENT_TEXT.EMPTY_FILTER_DESCRIPTION : APPOINTMENT_TEXT.EMPTY_DESCRIPTION}
            />
          </div>
        )}
        {!listState.error && !listState.isLoading && listState.appointments.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.PATIENT}</th>
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.DOCTOR}</th>
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.DATE}</th>
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.TIME}</th>
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.REASON}</th>
                    <th className="py-2 pr-3 font-medium">{APPOINTMENT_TEXT.STATUS}</th>
                    <th className="py-2 font-medium">{APPOINTMENT_TEXT.ACTIONS}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listState.appointments.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                      onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.DETAILS, appointment: row })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDialog({ type: APPOINTMENT_DIALOGS.DETAILS, appointment: row });
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`${APPOINTMENT_TEXT.VIEW_DETAILS}: ${row.patient?.name || "appointment"}`}
                    >
                      <td className="py-2.5 pr-3 font-medium">{row.patient?.name || "—"}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.doctor?.name || "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatShortDate(row.startsAt)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatTime(row.startsAt)}</td>
                      <td className="max-w-[10rem] truncate py-2.5 pr-3 text-muted-foreground">{row.reason || row.treatment || "—"}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={APPOINTMENT_STATUS_TONES[row.status] || "neutral"}>
                          {APPOINTMENT_STATUS_LABELS[row.status] || row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <IconButton label={APPOINTMENT_TEXT.EDIT} className="size-8"
                            onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.EDIT, appointment: row })}>
                            <PencilSimple className="size-4" />
                          </IconButton>
                          <IconButton label={APPOINTMENT_TEXT.VIEW_NOTES} className="size-8"
                            onClick={() => setDialog({ type: APPOINTMENT_DIALOGS.NOTES, appointment: row })}>
                            <NotePencil className="size-4" />
                          </IconButton>
                          <IconButton label={APPOINTMENT_TEXT.DELETE} className="size-8"
                            onClick={() => { setDeleteError(""); setDialog({ type: APPOINTMENT_DIALOGS.DELETE, appointment: row }); }}>
                            <Trash className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={listState.pagination.totalPages}
              total={listState.pagination.total}
              onPageChange={setPage}
              itemLabel="appointments"
            />
          </>
        )}
      </section>

      <AppointmentFormDialog open={dialog.type === APPOINTMENT_DIALOGS.ADD} onSubmit={handleCreate} onClose={() => setDialog({ type: null })} />
      <AppointmentFormDialog open={dialog.type === APPOINTMENT_DIALOGS.EDIT} appointment={dialog.appointment} onSubmit={handleEdit} onClose={() => setDialog({ type: null })} />
      <NotesDialog open={dialog.type === APPOINTMENT_DIALOGS.NOTES} appointment={dialog.appointment} onAdd={handleAddNote} onClose={() => setDialog({ type: null })} />
      <AppointmentDetailsDialog
        open={dialog.type === APPOINTMENT_DIALOGS.DETAILS}
        appointment={dialog.appointment}
        appointmentId={dialog.appointment?.id}
        onClose={() => setDialog({ type: null })}
        onEdit={(a) => setDialog({ type: APPOINTMENT_DIALOGS.EDIT, appointment: a })}
        onNotes={(a) => setDialog({ type: APPOINTMENT_DIALOGS.NOTES, appointment: a })}
      />
      <ConfirmDialog
        open={dialog.type === APPOINTMENT_DIALOGS.DELETE}
        onClose={() => setDialog({ type: null })}
        onConfirm={handleDelete}
        title={APPOINTMENT_TEXT.DELETE}
        description={APPOINTMENT_MESSAGES.DELETE_DESCRIPTION}
        confirmLabel={APPOINTMENT_TEXT.DELETE}
        loading={deleteLoading}
        error={deleteError}
      />
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    </div>
  );
}
