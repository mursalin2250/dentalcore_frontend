import { useState } from "react";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import {
  DOCTOR_DIALOGS,
  DOCTOR_MESSAGES,
  DOCTOR_TEXT,
} from "@/constants/doctors";
import { PATIENT_STATUS_LABELS, PATIENT_STATUS_TONES } from "@/constants/patients";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatNumber, formatShortDate } from "@/lib/format";
import DoctorFormDialog from "./DoctorFormDialog";
import { useDoctor } from "./useDoctors";

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function OverviewStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatNumber(value)}</p>
    </div>
  );
}

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const { data, isLoading, error, reload, updateDoctor } = useDoctor(id);
  const [dialog, setDialog] = useState({ type: null });
  const [announcement, setAnnouncement] = useState("");

  const doctor = data?.doctor;
  usePageTitle(doctor?.name || DOCTOR_TEXT.DETAILS_TITLE);

  const handleEdit = async (values) => {
    await updateDoctor(values);
    setAnnouncement(DOCTOR_MESSAGES.UPDATED(values.name.trim()));
    setDialog({ type: null });
  };

  if (isLoading) return <PageLoader />;

  if (error || !doctor) {
    return (
      <div className="py-4">
        <EmptyState
          icon={WarningCircle}
          title="Could not load doctor"
          description={error?.message || "Doctor not found."}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
              <Link to={ROUTES.DOCTORS}>
                <Button variant="secondary">Back to list</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const overview = data.overview || {
    patientsTreated: 0,
    inTreatment: 0,
    appointmentsToday: 0,
    patientsAssigned: 0,
  };
  const patients = data.patients || [];

  return (
    <div className="py-4">
      <div className="lg:hidden">
        <Link
          to={ROUTES.DOCTORS}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Doctors
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 lg:mt-0">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={doctor.name} src={doctor.avatarUrl} className="size-16 text-lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{doctor.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[doctor.title, doctor.specialty].filter(Boolean).join(" · ") || "Doctor"}
            </p>
          </div>
        </div>
        <Button onClick={() => setDialog({ type: DOCTOR_DIALOGS.EDIT })}>
          {DOCTOR_TEXT.EDIT}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Doctor information</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label={DOCTOR_TEXT.DESIGNATION} value={doctor.title} />
            <InfoRow label={DOCTOR_TEXT.SPECIALTY} value={doctor.specialty} />
            <InfoRow label={DOCTOR_TEXT.PHONE} value={doctor.phone} />
            <InfoRow label={DOCTOR_TEXT.EMAIL} value={doctor.email} />
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.OVERVIEW}</h2>
          <div className="mt-4 grid gap-3">
            <OverviewStat label={DOCTOR_TEXT.PATIENTS_TREATED} value={overview.patientsTreated} />
            <OverviewStat label={DOCTOR_TEXT.IN_TREATMENT} value={overview.inTreatment} />
            <OverviewStat label={DOCTOR_TEXT.APPOINTMENTS_TODAY} value={overview.appointmentsToday} />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">{DOCTOR_TEXT.CURRENT_PATIENTS}</h2>
          <p className="text-sm text-muted-foreground">
            {formatNumber(overview.patientsAssigned)} assigned
          </p>
        </div>

        {patients.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{DOCTOR_TEXT.NO_PATIENTS}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {patients.map((patient) => (
              <li key={patient.id}>
                <Link
                  to={ROUTES.PATIENT_DETAILS.replace(":id", patient.id)}
                  className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-surface-muted/40"
                >
                  <Avatar name={patient.name} src={patient.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOCTOR_TEXT.LAST_VISIT}:{" "}
                      {patient.lastVisit ? formatShortDate(patient.lastVisit) : "—"}
                    </p>
                  </div>
                  <Badge tone={PATIENT_STATUS_TONES[patient.status] || "neutral"}>
                    {PATIENT_STATUS_LABELS[patient.status] || patient.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DoctorFormDialog
        open={dialog.type === DOCTOR_DIALOGS.EDIT}
        doctor={doctor}
        onSubmit={handleEdit}
        onClose={() => setDialog({ type: null })}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
