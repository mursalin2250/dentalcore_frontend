import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Printer, WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import PageLoader from "@/components/ui/PageLoader";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SelectField from "@/components/ui/SelectField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  APPOINTMENT_STATUS_LABELS,
  GENDER_LABELS,
  PATIENT_DIALOGS,
  PATIENT_MESSAGES,
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TONES,
  PATIENT_TEXT,
} from "@/constants/patients";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { downloadTextPdf } from "@/lib/downloadPdf";
import { formatMoney, formatNumber, formatShortDate, formatTime } from "@/lib/format";
import PatientFormDialog from "./PatientFormDialog";
import PrescriptionFormDialog from "./PrescriptionFormDialog";
import { usePatient } from "./usePatients";

const INVOICE_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
};

const INVOICE_STATUS_TONES = {
  pending: "warning",
  paid: "success",
  cancelled: "neutral",
};

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function downloadPatientPdf(patient) {
  const lines = [
    `Patient ID: ${patient.patientCode || "—"}`,
    `Name: ${patient.name || "—"}`,
    `Status: ${PATIENT_STATUS_LABELS[patient.status] || patient.status || "—"}`,
    `Age: ${patient.age != null ? `${patient.age} years` : "—"}`,
    `Gender: ${patient.gender ? GENDER_LABELS[patient.gender] : "—"}`,
    `Phone: ${patient.phone || "—"}`,
    `Email: ${patient.email || "—"}`,
    `Address: ${patient.address || "—"}`,
    `Blood type: ${patient.bloodType || "—"}`,
    `Problem: ${patient.problem || "—"}`,
    `Treatment: ${patient.treatment || "—"}`,
    `Last visit: ${patient.lastVisit ? formatShortDate(patient.lastVisit) : "—"}`,
    `Treatment cost: ${formatMoney(patient.treatmentCost || 0, "BDT")}`,
    `Amount paid: ${formatMoney(patient.amountPaid || 0, "BDT")}`,
    `Due amount: ${formatMoney(patient.dueAmount || 0, "BDT")}`,
    `Doctor: ${
      patient.doctor && typeof patient.doctor === "object" ? patient.doctor.name : "—"
    }`,
  ];
  const safeName = (patient.name || "patient").replace(/[^\w.-]+/g, "_");
  downloadTextPdf({
    title: "DentalCore patient record",
    lines,
    filename: `${safeName}-record.pdf`,
  });
}

function AssignDoctorDialog({ open, currentDoctorId, onSubmit, onClose }) {
  const [doctorId, setDoctorId] = useState(currentDoctorId || "");
  const [options, setOptions] = useState([{ value: "", label: PATIENT_TEXT.NO_DOCTOR_OPTION }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setDoctorId(currentDoctorId || "");
    setError("");
    const controller = new AbortController();
    api(`${API_ENDPOINTS.DOCTORS}?limit=50`, { signal: controller.signal })
      .then((data) => {
        const list = (data.doctors || []).map((d) => ({
          value: d.id,
          label: d.title ? `${d.name} (${d.title})` : d.name,
        }));
        setOptions([{ value: "", label: PATIENT_TEXT.NO_DOCTOR_OPTION }, ...list]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open, currentDoctorId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit(doctorId || null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={PATIENT_TEXT.ASSIGN_DOCTOR}
      description="Choose the doctor responsible for this patient."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect
          label={PATIENT_TEXT.DOCTOR}
          options={options}
          value={doctorId}
          onChange={setDoctorId}
          placeholder={PATIENT_TEXT.NO_DOCTOR_OPTION}
        />
        {error && <FormError>{error}</FormError>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function PatientDetailsPage() {
  const { id } = useParams();
  const { data, isLoading, error, reload, updatePatient, addPrescription } = usePatient(id);
  const [dialog, setDialog] = useState({ type: null });
  const [announcement, setAnnouncement] = useState("");

  const patient = data?.patient;
  usePageTitle(patient?.name || PATIENT_TEXT.DETAILS_TITLE);

  const handleEditSubmit = async (values) => {
    await updatePatient(values);
    setAnnouncement(PATIENT_MESSAGES.UPDATED(values.name.trim()));
    setDialog({ type: null });
  };

  const handlePrescriptionSubmit = async (payload) => {
    await addPrescription(payload);
    setAnnouncement(PATIENT_MESSAGES.PRESCRIPTION_ADDED);
    setDialog({ type: null });
  };

  const handleAssignDoctor = async (doctorId) => {
    await updatePatient({ doctor: doctorId });
    setAnnouncement(PATIENT_MESSAGES.DOCTOR_ASSIGNED);
  };

  if (isLoading) return <PageLoader />;

  if (error || !patient) {
    return (
      <div className="py-4">
        <EmptyState
          icon={WarningCircle}
          title="Could not load patient"
          description={error?.message || "Patient not found."}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
              <Link to={ROUTES.PATIENTS}>
                <Button variant="secondary">Back to list</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const ageLabel =
    patient.age != null
      ? `${formatNumber(patient.age)} years`
      : patient.dateOfBirth
        ? formatShortDate(patient.dateOfBirth)
        : "—";

  const payments = data.payments || [];
  const visits = data.visits || [];
  const visitCount = patient.visitCount ?? 0;
  const prescriptions = patient.prescriptions || [];
  const doctor = patient.doctor && typeof patient.doctor === "object" ? patient.doctor : null;

  return (
    <div className="py-4">
      {/* Mobile-only back link; desktop uses header breadcrumb */}
      <div className="lg:hidden">
        <Link
          to={ROUTES.PATIENTS}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Patients
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 lg:mt-0">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={patient.name} src={patient.avatarUrl} className="size-14 text-base" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{patient.name}</h1>
              <Badge tone={PATIENT_STATUS_TONES[patient.status] || "neutral"}>
                {PATIENT_STATUS_LABELS[patient.status] || patient.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[patient.patientCode, ageLabel, patient.gender ? GENDER_LABELS[patient.gender] : null]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadPatientPdf(patient)}>
            <Printer /> {PATIENT_TEXT.PRINT}
          </Button>
          <Button variant="secondary" onClick={() => setDialog({ type: PATIENT_DIALOGS.ADD_PRESCRIPTION })}>
            <Plus /> {PATIENT_TEXT.ADD_PRESCRIPTION}
          </Button>
          <Button onClick={() => setDialog({ type: PATIENT_DIALOGS.EDIT })}>
            {PATIENT_TEXT.EDIT}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Patient information</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label={PATIENT_TEXT.PATIENT_ID} value={patient.patientCode} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Address" value={patient.address} />
            <InfoRow label="Blood type" value={patient.bloodType} />
            <InfoRow label={PATIENT_TEXT.PROBLEM} value={patient.problem} />
            <InfoRow label={PATIENT_TEXT.TREATMENT} value={patient.treatment} />
          </dl>
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{PATIENT_TEXT.ASSIGNED_DOCTOR}</h2>
          {doctor ? (
            <div className="mt-5 flex flex-1 flex-col items-center text-center">
              <Avatar name={doctor.name} src={doctor.avatarUrl} className="size-20 text-lg" />
              <p className="mt-3 text-base font-semibold tracking-tight">{doctor.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[doctor.title, doctor.specialty].filter(Boolean).join(" · ") || doctor.specialty || "Doctor"}
              </p>
              {doctor.phone ? (
                <p className="mt-2 text-sm text-muted-foreground">{doctor.phone}</p>
              ) : null}
              {doctor.email ? (
                <p className="mt-0.5 break-all text-sm text-muted-foreground">{doctor.email}</p>
              ) : null}
              <div className="mt-5 flex w-full flex-col gap-2">
                <Link to={ROUTES.DOCTOR_DETAILS.replace(":id", doctor.id)} className="w-full">
                  <Button variant="secondary" className="w-full">
                    {PATIENT_TEXT.VIEW_DOCTOR}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setDialog({ type: PATIENT_DIALOGS.ASSIGN_DOCTOR })}
                >
                  {PATIENT_TEXT.CHANGE_DOCTOR}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
              <Avatar name="?" className="size-20 text-lg opacity-40" />
              <p className="mt-3 text-sm text-muted-foreground">{PATIENT_TEXT.NO_DOCTOR}</p>
              <Button
                className="mt-5 w-full"
                onClick={() => setDialog({ type: PATIENT_DIALOGS.ASSIGN_DOCTOR })}
              >
                {PATIENT_TEXT.ASSIGN_DOCTOR}
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold tracking-tight">{PATIENT_TEXT.OVERVIEW}</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow
              label="Status"
              value={PATIENT_STATUS_LABELS[patient.status] || patient.status}
            />
            <InfoRow
              label="Registered"
              value={patient.createdAt ? formatShortDate(patient.createdAt) : null}
            />
            <InfoRow
              label={PATIENT_TEXT.LAST_VISIT}
              value={patient.lastVisit ? formatShortDate(patient.lastVisit) : null}
            />
            <InfoRow label={PATIENT_TEXT.VISIT_COUNT} value={formatNumber(visitCount)} />
            <InfoRow label={PATIENT_TEXT.PROBLEM} value={patient.problem} />
            <InfoRow label={PATIENT_TEXT.TREATMENT} value={patient.treatment} />
            <InfoRow
              label={PATIENT_TEXT.TREATMENT_COST}
              value={formatMoney(patient.treatmentCost || 0, "BDT")}
            />
            <InfoRow
              label={PATIENT_TEXT.AMOUNT_PAID}
              value={formatMoney(patient.amountPaid || 0, "BDT")}
            />
            <InfoRow
              label={PATIENT_TEXT.DUE_AMOUNT}
              value={formatMoney(patient.dueAmount || 0, "BDT")}
            />
          </dl>
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">{PATIENT_TEXT.PRESCRIPTION}</h2>
            <Button
              variant="secondary"
              className="h-9 px-3"
              onClick={() => setDialog({ type: PATIENT_DIALOGS.ADD_PRESCRIPTION })}
            >
              <Plus /> {PATIENT_TEXT.ADD_PRESCRIPTION}
            </Button>
          </div>
          {prescriptions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{PATIENT_TEXT.NO_PRESCRIPTIONS}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...prescriptions].reverse().map((rx) => (
                <li
                  key={rx.id}
                  className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5"
                >
                  <p className="text-xs text-muted-foreground">
                    {rx.createdAt ? formatShortDate(rx.createdAt) : ""}
                  </p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-sm">
                    {(rx.medicines || []).map((med, i) => (
                      <li key={i}>{med}</li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold tracking-tight">{PATIENT_TEXT.VISIT_HISTORY}</h2>
        {visits.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{PATIENT_TEXT.NO_VISITS}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Doctor</th>
                  <th className="py-2 pr-3">Treatment</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id} className="border-t border-border">
                    <td className="py-2.5 pr-3">
                      {visit.startsAt ? formatShortDate(visit.startsAt) : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {visit.startsAt ? formatTime(visit.startsAt) : "—"}
                    </td>
                    <td className="py-2.5 pr-3">{visit.doctor?.name || "—"}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {visit.treatment || "—"}
                    </td>
                    <td className="py-2.5">
                      {APPOINTMENT_STATUS_LABELS[visit.status] || visit.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold tracking-tight">{PATIENT_TEXT.PAYMENT_HISTORY}</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{PATIENT_TEXT.NO_PAYMENTS}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="py-2.5 pr-3 font-medium">{payment.number}</td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {formatMoney(payment.totalAmount, "BDT")}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={INVOICE_STATUS_TONES[payment.status] || "neutral"}>
                        {INVOICE_STATUS_LABELS[payment.status] || payment.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {payment.paidAt
                        ? formatShortDate(payment.paidAt)
                        : payment.createdAt
                          ? formatShortDate(payment.createdAt)
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PatientFormDialog
        open={dialog.type === PATIENT_DIALOGS.EDIT}
        patient={patient}
        onSubmit={handleEditSubmit}
        onClose={() => setDialog({ type: null })}
      />

      <PrescriptionFormDialog
        open={dialog.type === PATIENT_DIALOGS.ADD_PRESCRIPTION}
        onSubmit={handlePrescriptionSubmit}
        onClose={() => setDialog({ type: null })}
      />

      <AssignDoctorDialog
        open={dialog.type === PATIENT_DIALOGS.ASSIGN_DOCTOR}
        currentDoctorId={doctor?.id || ""}
        onSubmit={handleAssignDoctor}
        onClose={() => setDialog({ type: null })}
      />

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
