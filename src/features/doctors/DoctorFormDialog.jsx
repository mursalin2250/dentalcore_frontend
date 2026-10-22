import { useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import IconButton from "@/components/ui/IconButton";
import TextField from "@/components/ui/TextField";
import {
  DOCTOR_MESSAGES,
  DOCTOR_TEXT,
  MAX_AVATAR_BYTES,
  MAX_CERTIFICATION_ROWS,
  MAX_EDUCATION_ROWS,
} from "@/constants/doctors";
import { useForm } from "@/hooks/useForm";
import { validateDoctor } from "./validateDoctor";

function emptyEducation() {
  return { institution: "", degree: "", fieldOfStudy: "", completionYear: "" };
}

function emptyCertification() {
  return { title: "", issuingBody: "", issueYear: "", expiryYear: "" };
}

function emptyValues() {
  return {
    name: "",
    specialty: "",
    title: "",
    phone: "",
    email: "",
    avatarUrl: "",
    address: { street: "", city: "", district: "", postalCode: "" },
    education: [],
    certifications: [],
  };
}

function fromDoctor(doctor) {
  const address = doctor.address || {};
  return {
    name: doctor.name || "",
    specialty: doctor.specialty || "",
    title: doctor.title || "",
    phone: doctor.phone || "",
    email: doctor.email || "",
    avatarUrl: doctor.avatarUrl || "",
    address: {
      street: address.street || "",
      city: address.city || "",
      district: address.district || "",
      postalCode: address.postalCode || "",
    },
    education: Array.isArray(doctor.education)
      ? doctor.education.map((e) => ({
          institution: e.institution || "",
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || "",
          completionYear: e.completionYear != null ? String(e.completionYear) : "",
        }))
      : [],
    certifications: Array.isArray(doctor.certifications)
      ? doctor.certifications.map((c) => ({
          title: c.title || "",
          issuingBody: c.issuingBody || "",
          issueYear: c.issueYear != null ? String(c.issueYear) : "",
          expiryYear: c.expiryYear != null ? String(c.expiryYear) : "",
        }))
      : [],
  };
}

function toYear(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error(DOCTOR_MESSAGES.PHOTO_TOO_LARGE));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function DoctorForm({ doctor, onSubmit, onCancel }) {
  const isEdit = Boolean(doctor);
  const form = useForm({
    initialValues: isEdit ? fromDoctor(doctor) : emptyValues(),
    validate: validateDoctor,
    onSubmit: async (values) => {
      await onSubmit({
        name: values.name,
        specialty: values.specialty,
        title: values.title,
        phone: values.phone,
        email: values.email,
        avatarUrl: values.avatarUrl || "",
        address: values.address,
        education: values.education.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          completionYear: toYear(e.completionYear),
        })),
        certifications: values.certifications.map((c) => ({
          title: c.title,
          issuingBody: c.issuingBody,
          issueYear: toYear(c.issueYear),
          expiryYear: toYear(c.expiryYear),
        })),
      });
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

  const setAddressField = (key, value) => {
    form.setValue("address", { ...form.values.address, [key]: value });
  };

  const setEducationRow = (index, key, value) => {
    const next = form.values.education.map((row, i) =>
      i === index ? { ...row, [key]: value } : row,
    );
    form.setValue("education", next);
  };

  const addEducation = () => {
    if (form.values.education.length >= MAX_EDUCATION_ROWS) return;
    form.setValue("education", [...form.values.education, emptyEducation()]);
  };

  const removeEducation = (index) => {
    form.setValue(
      "education",
      form.values.education.filter((_, i) => i !== index),
    );
  };

  const setCertRow = (index, key, value) => {
    const next = form.values.certifications.map((row, i) =>
      i === index ? { ...row, [key]: value } : row,
    );
    form.setValue("certifications", next);
  };

  const addCertification = () => {
    if (form.values.certifications.length >= MAX_CERTIFICATION_ROWS) return;
    form.setValue("certifications", [...form.values.certifications, emptyCertification()]);
  };

  const removeCertification = (index) => {
    form.setValue(
      "certifications",
      form.values.certifications.filter((_, i) => i !== index),
    );
  };

  return (
    <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
      <TextField label="Full name" autoComplete="off" {...form.getFieldProps("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={DOCTOR_TEXT.DESIGNATION}
          autoComplete="off"
          placeholder="e.g. BDS, FCPS"
          {...form.getFieldProps("title")}
        />
        <TextField
          label={DOCTOR_TEXT.SPECIALTY}
          autoComplete="off"
          placeholder="e.g. Orthodontics"
          {...form.getFieldProps("specialty")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={DOCTOR_TEXT.PHONE} type="tel" autoComplete="off" {...form.getFieldProps("phone")} />
        <TextField label={DOCTOR_TEXT.EMAIL} type="email" autoComplete="off" {...form.getFieldProps("email")} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{DOCTOR_TEXT.ADDRESS}</legend>
        <TextField
          label={DOCTOR_TEXT.STREET}
          autoComplete="street-address"
          value={form.values.address.street}
          onChange={(e) => setAddressField("street", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label={DOCTOR_TEXT.CITY}
            autoComplete="address-level2"
            value={form.values.address.city}
            onChange={(e) => setAddressField("city", e.target.value)}
          />
          <TextField
            label={DOCTOR_TEXT.DISTRICT}
            autoComplete="address-level1"
            value={form.values.address.district}
            onChange={(e) => setAddressField("district", e.target.value)}
          />
          <TextField
            label={DOCTOR_TEXT.POSTAL_CODE}
            autoComplete="postal-code"
            value={form.values.address.postalCode}
            onChange={(e) => setAddressField("postalCode", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <legend className="text-sm font-medium">{DOCTOR_TEXT.EDUCATION}</legend>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-2 text-xs"
            onClick={addEducation}
            disabled={form.values.education.length >= MAX_EDUCATION_ROWS}
          >
            <Plus className="size-3.5" /> {DOCTOR_TEXT.ADD_EDUCATION}
          </Button>
        </div>
        {form.values.education.length === 0 && (
          <p className="text-sm text-muted-foreground">{DOCTOR_TEXT.NO_EDUCATION}</p>
        )}
        {form.values.education.map((row, index) => (
          <div key={index} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex justify-end">
              <IconButton
                type="button"
                label={DOCTOR_TEXT.REMOVE_ROW}
                onClick={() => removeEducation(index)}
              >
                <Trash className="size-4" />
              </IconButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={DOCTOR_TEXT.INSTITUTION}
                value={row.institution}
                onChange={(e) => setEducationRow(index, "institution", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.DEGREE}
                value={row.degree}
                onChange={(e) => setEducationRow(index, "degree", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.FIELD_OF_STUDY}
                value={row.fieldOfStudy}
                onChange={(e) => setEducationRow(index, "fieldOfStudy", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.COMPLETION_YEAR}
                inputMode="numeric"
                placeholder="e.g. 2018"
                value={row.completionYear}
                onChange={(e) => setEducationRow(index, "completionYear", e.target.value)}
              />
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <legend className="text-sm font-medium">{DOCTOR_TEXT.CERTIFICATIONS}</legend>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-2 text-xs"
            onClick={addCertification}
            disabled={form.values.certifications.length >= MAX_CERTIFICATION_ROWS}
          >
            <Plus className="size-3.5" /> {DOCTOR_TEXT.ADD_CERTIFICATION}
          </Button>
        </div>
        {form.values.certifications.length === 0 && (
          <p className="text-sm text-muted-foreground">{DOCTOR_TEXT.NO_CERTIFICATIONS}</p>
        )}
        {form.values.certifications.map((row, index) => (
          <div key={index} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex justify-end">
              <IconButton
                type="button"
                label={DOCTOR_TEXT.REMOVE_ROW}
                onClick={() => removeCertification(index)}
              >
                <Trash className="size-4" />
              </IconButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label={DOCTOR_TEXT.CERT_TITLE}
                value={row.title}
                onChange={(e) => setCertRow(index, "title", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.ISSUING_BODY}
                value={row.issuingBody}
                onChange={(e) => setCertRow(index, "issuingBody", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.ISSUE_YEAR}
                inputMode="numeric"
                value={row.issueYear}
                onChange={(e) => setCertRow(index, "issueYear", e.target.value)}
              />
              <TextField
                label={DOCTOR_TEXT.EXPIRY_YEAR}
                inputMode="numeric"
                value={row.expiryYear}
                onChange={(e) => setCertRow(index, "expiryYear", e.target.value)}
              />
            </div>
          </div>
        ))}
      </fieldset>

      <div>
        <p className="mb-1.5 text-sm font-medium">{DOCTOR_TEXT.PHOTO}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={form.values.name || "Doctor"} src={form.values.avatarUrl || null} className="size-14" />
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-muted">
            Choose photo
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

      {form.formError && <FormError>{form.formError}</FormError>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={form.isSubmitting}>
          {isEdit ? "Save changes" : DOCTOR_TEXT.ADD}
        </Button>
      </div>
    </form>
  );
}

export default function DoctorFormDialog({ open, doctor, onSubmit, onClose }) {
  const isEdit = Boolean(doctor);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? DOCTOR_TEXT.EDIT : DOCTOR_TEXT.ADD}
      description={
        isEdit ? "Update this doctor's profile." : "Add a dentist or specialist to the clinic roster."
      }
      className="max-w-2xl"
    >
      <DoctorForm doctor={doctor} onSubmit={onSubmit} onCancel={onClose} />
    </Dialog>
  );
}
