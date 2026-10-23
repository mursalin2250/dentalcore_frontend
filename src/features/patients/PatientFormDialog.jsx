import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DateField from "@/components/ui/DateField";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import { CURRENCY_MINOR_UNIT } from "@/constants/locale";
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MAX_AVATAR_BYTES,
  PATIENT_MESSAGES,
  PATIENT_STATUSES,
  PATIENT_TEXT,
  STATUS_OPTIONS,
} from "@/constants/patients";
import { useForm } from "@/hooks/useForm";
import { api } from "@/lib/api";
import { validatePatient } from "./validatePatient";

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function emptyValues() {
  return {
    patientCode: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    bloodType: "",
    status: PATIENT_STATUSES.ADMITTED,
    avatarUrl: "",
    doctor: "",
    problem: "",
    treatment: "",
    treatmentCost: "",
    initialPayment: "",
    dueAmount: "",
  };
}

function fromPatient(patient) {
  return {
    patientCode: patient.patientCode || "",
    name: patient.name || "",
    phone: patient.phone || "",
    email: patient.email || "",
    address: patient.address || "",
    gender: patient.gender || "",
    dateOfBirth: toDateInput(patient.dateOfBirth),
    bloodType: patient.bloodType || "",
    status: patient.status || PATIENT_STATUSES.ADMITTED,
    avatarUrl: patient.avatarUrl || "",
    doctor: patient.doctor?.id || patient.doctor || "",
    problem: patient.problem || "",
    treatment: patient.treatment || "",
    treatmentCost:
      patient.treatmentCost != null && patient.treatmentCost !== 0
        ? String(patient.treatmentCost / CURRENCY_MINOR_UNIT)
        : "",
    initialPayment:
      patient.amountPaid != null && patient.amountPaid !== 0
        ? String(patient.amountPaid / CURRENCY_MINOR_UNIT)
        : "",
    dueAmount:
      patient.dueAmount != null && patient.dueAmount !== 0
        ? String(patient.dueAmount / CURRENCY_MINOR_UNIT)
        : patient.treatmentCost
          ? String(Math.max(0, (patient.treatmentCost - (patient.amountPaid || 0)) / CURRENCY_MINOR_UNIT))
          : "",
  };
}

function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error(PATIENT_MESSAGES.PHOTO_TOO_LARGE));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function PatientForm({ patient, onSubmit, onCancel, doctorOptions }) {
  const isEdit = Boolean(patient);
  const form = useForm({
    initialValues: isEdit ? fromPatient(patient) : emptyValues(),
    validate: validatePatient,
    onSubmit: async (values) => {
      const toMinor = (value) => {
        const n = Number(String(value).replace(/,/g, "").trim());
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.round(n * CURRENCY_MINOR_UNIT);
      };
      const treatmentCost = toMinor(values.treatmentCost);
      let amountPaid = toMinor(values.initialPayment);
      // On edit, prefer dueAmount when provided to derive paid.
      if (isEdit && values.dueAmount !== "" && values.dueAmount != null) {
        const due = toMinor(values.dueAmount);
        amountPaid = Math.max(0, treatmentCost - due);
      }
      if (amountPaid > treatmentCost) amountPaid = treatmentCost;
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth || null,
        gender: values.gender || undefined,
        bloodType: values.bloodType || undefined,
        avatarUrl: values.avatarUrl || "",
        doctor: values.doctor || null,
        treatmentCost,
        amountPaid,
      };
      delete payload.initialPayment;
      delete payload.dueAmount;
      await onSubmit(payload);
    },
  });

  const [photoError, setPhotoError] = useState("");

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    try {
      const dataUrl = await readPhotoAsDataUrl(file);
      form.setValue("avatarUrl", dataUrl);
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  return (
    <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={PATIENT_TEXT.PATIENT_ID}
          autoComplete="off"
          hint={!isEdit ? PATIENT_TEXT.PATIENT_ID_HINT : undefined}
          {...form.getFieldProps("patientCode")}
        />
        <TextField label="Full name" autoComplete="off" {...form.getFieldProps("name")} />
        <TextField label="Phone" type="tel" autoComplete="off" {...form.getFieldProps("phone")} />
        <TextField label="Email" type="email" autoComplete="off" {...form.getFieldProps("email")} />
        <DateField label="Date of birth" {...form.getFieldProps("dateOfBirth")} />
        <SelectField label="Gender" options={GENDER_OPTIONS} {...form.getFieldProps("gender")} />
        <SelectField label="Blood type" options={BLOOD_TYPE_OPTIONS} {...form.getFieldProps("bloodType")} />
        <SelectField label="Status" options={STATUS_OPTIONS} {...form.getFieldProps("status")} />
      </div>

      <TextField label="Address" autoComplete="off" {...form.getFieldProps("address")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-sm font-medium">{PATIENT_TEXT.PHOTO}</p>
          <div className="flex items-center gap-3">
            <Avatar name={form.values.name || "Patient"} src={form.values.avatarUrl || undefined} />
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted">
              Upload photo
              <input type="file" accept="image/*" className="sr-only" onChange={onPhotoChange} />
            </label>
            {form.values.avatarUrl && (
              <Button type="button" variant="secondary" className="h-10" onClick={() => form.setValue("avatarUrl", "")}>
                Remove
              </Button>
            )}
          </div>
          {photoError && <p className="mt-1.5 text-sm text-danger-text">{photoError}</p>}
        </div>
        <SearchableSelect
          label={PATIENT_TEXT.DOCTOR}
          options={doctorOptions}
          value={form.values.doctor}
          onChange={(v) => form.setValue("doctor", v)}
          error={form.errors.doctor}
          placeholder={PATIENT_TEXT.NO_DOCTOR_OPTION}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{PATIENT_TEXT.PROBLEM}</label>
        <textarea
          name="problem"
          rows={2}
          value={form.values.problem}
          onChange={(e) => form.setValue("problem", e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-offset-0"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{PATIENT_TEXT.TREATMENT}</label>
        <textarea
          name="treatment"
          rows={2}
          value={form.values.treatment}
          onChange={(e) => form.setValue("treatment", e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-offset-0"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={PATIENT_TEXT.TREATMENT_COST}
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          hint={PATIENT_TEXT.MONEY_HINT}
          {...form.getFieldProps("treatmentCost")}
        />
        {isEdit ? (
          <TextField
            label={PATIENT_TEXT.DUE_AMOUNT}
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            hint={PATIENT_TEXT.MONEY_HINT}
            {...form.getFieldProps("dueAmount")}
          />
        ) : (
          <TextField
            label={PATIENT_TEXT.INITIAL_PAYMENT}
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            hint={PATIENT_TEXT.MONEY_HINT}
            {...form.getFieldProps("initialPayment")}
          />
        )}
      </div>

      {form.formError && <FormError>{form.formError}</FormError>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={form.isSubmitting}>
          {isEdit ? "Save changes" : PATIENT_TEXT.ADD}
        </Button>
      </div>
    </form>
  );
}

export default function PatientFormDialog({ open, patient, onSubmit, onClose }) {
  const isEdit = Boolean(patient);
  const [doctorOptions, setDoctorOptions] = useState([
    { value: "", label: PATIENT_TEXT.NO_DOCTOR_OPTION },
  ]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    api(`${API_ENDPOINTS.DOCTORS}?limit=50`, { signal: controller.signal })
      .then((data) => {
        const options = (data.doctors || []).map((d) => ({
          value: d.id,
          label: d.title ? `${d.name} (${d.title})` : d.name,
        }));
        setDoctorOptions([{ value: "", label: PATIENT_TEXT.NO_DOCTOR_OPTION }, ...options]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? PATIENT_TEXT.EDIT : PATIENT_TEXT.ADD}
      description={
        isEdit
          ? "Update this patient's record."
          : "Fill in the details. Leave Patient ID blank to generate one."
      }
      className="max-w-xl"
    >
      <PatientForm
        patient={patient}
        onSubmit={onSubmit}
        onCancel={onClose}
        doctorOptions={doctorOptions}
      />
    </Dialog>
  );
}
