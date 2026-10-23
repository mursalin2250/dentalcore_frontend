import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SelectField from "@/components/ui/SelectField";
import DateTimeField from "@/components/ui/DateTimeField";
import TextField from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  APPOINTMENT_MESSAGES,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TEXT,
} from "@/constants/appointments";
import { useForm } from "@/hooks/useForm";
import { api } from "@/lib/api";



function emptyValues() {
  return {
    patient: "",
    doctor: "",
    startsAt: "",
    reason: "",
    status: APPOINTMENT_STATUSES.PENDING,
    note: "",
    newStartsAt: "",
  };
}

function fromAppointment(a) {
  return {
    patient: a.patient?.id || a.patient || "",
    doctor: a.doctor?.id || a.doctor || "",
    startsAt: a.startsAt || "",
    reason: a.reason || a.treatment || "",
    status: a.status || APPOINTMENT_STATUSES.PENDING,
    note: "",
    newStartsAt: "",
  };
}

function validateAppointment(values) {
  const errors = {};
  if (!values.patient) errors.patient = APPOINTMENT_MESSAGES.PATIENT_REQUIRED;
  if (!values.doctor) errors.doctor = APPOINTMENT_MESSAGES.DOCTOR_REQUIRED;
  if (!values.startsAt) errors.startsAt = APPOINTMENT_MESSAGES.START_REQUIRED;
  if (values.status === APPOINTMENT_STATUSES.RESCHEDULED && !values.newStartsAt) {
    errors.newStartsAt = APPOINTMENT_MESSAGES.RESCHEDULE_TIME_REQUIRED;
  }
  return errors;
}

function AppointmentForm({ appointment, onSubmit, onCancel, patientOptions, doctorOptions }) {
  const isEdit = Boolean(appointment);
  const form = useForm({
    initialValues: isEdit ? fromAppointment(appointment) : emptyValues(),
    validate: validateAppointment,
    onSubmit: async (values) => {
      const payload = {
        patient: values.patient,
        doctor: values.doctor,
        startsAt: values.startsAt,
        reason: values.reason,
        status: values.status,
      };
      if (!isEdit && values.note?.trim()) payload.note = values.note.trim();
      if (values.status === APPOINTMENT_STATUSES.RESCHEDULED && values.newStartsAt) {
        payload.newStartsAt = values.newStartsAt;
      }
      await onSubmit(payload);
    },
  });

  useEffect(() => {
    if (isEdit || !form.values.patient) return;
    const opt = patientOptions.find((p) => p.value === form.values.patient);
    if (opt?.doctorId && !form.values.doctor) form.setValue("doctor", opt.doctorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.patient]);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
      <SearchableSelect
        label={APPOINTMENT_TEXT.PATIENT}
        options={patientOptions}
        value={form.values.patient}
        onChange={(v) => form.setValue("patient", v)}
        error={form.errors.patient}
        placeholder="Select patient"
      />
      <SearchableSelect
        label={APPOINTMENT_TEXT.DOCTOR}
        options={doctorOptions}
        value={form.values.doctor}
        onChange={(v) => form.setValue("doctor", v)}
        error={form.errors.doctor}
        placeholder="Select doctor"
      />
      <DateTimeField
        label={`${APPOINTMENT_TEXT.DATE} / ${APPOINTMENT_TEXT.TIME}`}
        name="startsAt"
        value={form.values.startsAt}
        onChange={(e) => form.setValue("startsAt", e.target.value)}
        error={form.errors.startsAt}
      />
      {isEdit && (
        <SelectField label={APPOINTMENT_TEXT.STATUS} options={APPOINTMENT_STATUS_OPTIONS} {...form.getFieldProps("status")} />
      )}
      {isEdit && form.values.status === APPOINTMENT_STATUSES.RESCHEDULED && (
        <DateTimeField
          label={APPOINTMENT_TEXT.NEW_DATE_TIME}
          name="newStartsAt"
          value={form.values.newStartsAt}
          onChange={(e) => form.setValue("newStartsAt", e.target.value)}
          error={form.errors.newStartsAt}
        />
      )}
      <TextField label={APPOINTMENT_TEXT.REASON} {...form.getFieldProps("reason")} />
      {!isEdit && <TextField label={APPOINTMENT_TEXT.NOTE} {...form.getFieldProps("note")} />}
      {form.formError && <FormError>{form.formError}</FormError>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={form.isSubmitting}>{isEdit ? "Save changes" : APPOINTMENT_TEXT.ADD}</Button>
      </div>
    </form>
  );
}

export default function AppointmentFormDialog({ open, appointment, onSubmit, onClose }) {
  const isEdit = Boolean(appointment);
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);

  useEffect(() => {
    if (!open) return undefined;
    const c = new AbortController();
    Promise.all([
      api(`${API_ENDPOINTS.PATIENTS}?limit=50`, { signal: c.signal }),
      api(`${API_ENDPOINTS.DOCTORS}?limit=50`, { signal: c.signal }),
    ])
      .then(([pd, dd]) => {
        setPatientOptions((pd.patients || []).map((p) => ({
          value: p.id,
          label: p.name,
          doctorId: p.doctor?.id || p.doctor || "",
        })));
        setDoctorOptions((dd.doctors || []).map((d) => ({
          value: d.id,
          label: d.title ? `${d.name} (${d.title})` : d.name,
        })));
      })
      .catch(() => {});
    return () => c.abort();
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? APPOINTMENT_TEXT.EDIT : APPOINTMENT_TEXT.ADD}
      description={isEdit ? "Update this visit." : "Book a patient with a doctor."}
      className="max-w-lg"
    >
      {open && (
        <AppointmentForm
          appointment={appointment}
          onSubmit={onSubmit}
          onCancel={onClose}
          patientOptions={patientOptions}
          doctorOptions={doctorOptions}
        />
      )}
    </Dialog>
  );
}
