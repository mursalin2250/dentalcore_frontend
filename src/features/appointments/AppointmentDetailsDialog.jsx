import { useEffect, useState } from "react";
import { NotePencil, PencilSimple, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Skeleton from "@/components/ui/Skeleton";
import { API_ENDPOINTS } from "@/constants/api";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  APPOINTMENT_TEXT,
} from "@/constants/appointments";
import { api } from "@/lib/api";
import { formatShortDate, formatTime } from "@/lib/format";

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function patientName(appointment) {
  if (!appointment) return "—";
  if (typeof appointment.patient === "string") return appointment.patient;
  return appointment.patient?.name || "—";
}

function doctorName(appointment) {
  if (!appointment) return "—";
  if (typeof appointment.doctor === "string") return appointment.doctor;
  return appointment.doctor?.name || "—";
}

/**
 * Shared visit details modal. Pass an appointment object or id.
 * Always refetches full record so dashboard stubs and list rows both work.
 */
export default function AppointmentDetailsDialog({
  open,
  appointmentId,
  appointment: seed,
  onClose,
  onEdit,
  onNotes,
  showActions = true,
}) {
  const [appointment, setAppointment] = useState(seed || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const id = appointmentId || seed?.id;

  useEffect(() => {
    if (!open || !id) {
      if (!open) {
        setAppointment(null);
        setError(null);
        setIsLoading(false);
      }
      return undefined;
    }
    setAppointment(seed || null);
    setError(null);
    setIsLoading(true);
    const c = new AbortController();
    api(API_ENDPOINTS.appointment(id), { signal: c.signal })
      .then((data) => setAppointment(data.appointment || data))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e);
        if (!seed) setAppointment(null);
      })
      .finally(() => {
        if (!c.signal.aborted) setIsLoading(false);
      });
    return () => c.abort();
  }, [open, id, seed]);

  if (!open) return null;

  const notes = Array.isArray(appointment?.notes) ? appointment.notes : [];
  const pName = patientName(appointment || seed);
  const dName = doctorName(appointment || seed);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={APPOINTMENT_TEXT.DETAILS_TITLE}
      description={[pName, dName].filter((n) => n && n !== "—").join(" · ") || undefined}
      className="max-w-lg"
    >
      {isLoading && !appointment && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {error && !appointment && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <WarningCircle className="size-8 text-danger" />
          <p className="text-sm text-muted-foreground">{error.message || "Could not load visit."}</p>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      )}

      {appointment && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status] || "neutral"}>
              {APPOINTMENT_STATUS_LABELS[appointment.status] || appointment.status}
            </Badge>
            {isLoading && <span className="text-xs text-muted-foreground">Updating…</span>}
          </div>

          <dl className="space-y-3">
            <DetailRow label={APPOINTMENT_TEXT.PATIENT}>{pName}</DetailRow>
            <DetailRow label={APPOINTMENT_TEXT.DOCTOR}>{dName}</DetailRow>
            <DetailRow label={APPOINTMENT_TEXT.DATE}>
              <span className="tabular-nums">
                {appointment.startsAt ? formatShortDate(appointment.startsAt) : "—"}
              </span>
            </DetailRow>
            <DetailRow label={APPOINTMENT_TEXT.TIME}>
              <span className="tabular-nums">
                {appointment.startsAt ? formatTime(appointment.startsAt) : "—"}
              </span>
            </DetailRow>
            {appointment.originalStartAt && (
              <DetailRow label={APPOINTMENT_TEXT.ORIGINAL_TIME}>
                <span className="tabular-nums">
                  {formatShortDate(appointment.originalStartAt)} · {formatTime(appointment.originalStartAt)}
                </span>
              </DetailRow>
            )}
            <DetailRow label={APPOINTMENT_TEXT.REASON}>
              {appointment.reason || appointment.treatment || APPOINTMENT_TEXT.NO_REASON}
            </DetailRow>
            {appointment.createdAt && (
              <DetailRow label={APPOINTMENT_TEXT.CREATED_AT}>
                <span className="tabular-nums">
                  {formatShortDate(appointment.createdAt)} · {formatTime(appointment.createdAt)}
                </span>
              </DetailRow>
            )}
            {appointment.updatedAt && (
              <DetailRow label={APPOINTMENT_TEXT.UPDATED_AT}>
                <span className="tabular-nums">
                  {formatShortDate(appointment.updatedAt)} · {formatTime(appointment.updatedAt)}
                </span>
              </DetailRow>
            )}
          </dl>

          <div>
            <h3 className="text-sm font-semibold">{APPOINTMENT_TEXT.NOTES}</h3>
            {notes.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{APPOINTMENT_TEXT.NO_NOTES}</p>
            ) : (
              <ul className="mt-2 max-h-48 space-y-3 overflow-y-auto border-t border-border pt-3">
                {notes.map((n) => (
                  <li
                    key={n.id || n.createdAt}
                    className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2"
                  >
                    <p className="text-sm">{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        n.createdBy?.name,
                        n.createdAt
                          ? `${formatShortDate(n.createdAt)} · ${formatTime(n.createdAt)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            {showActions && onNotes && (
              <Button type="button" variant="secondary" onClick={() => onNotes(appointment)}>
                <NotePencil className="size-4" />
                {APPOINTMENT_TEXT.VIEW_NOTES}
              </Button>
            )}
            {showActions && onEdit && (
              <Button type="button" onClick={() => onEdit(appointment)}>
                <PencilSimple className="size-4" />
                {APPOINTMENT_TEXT.EDIT}
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
