import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import TextField from "@/components/ui/TextField";
import { DOCTOR_MESSAGES, DOCTOR_TEXT, MAX_AVATAR_BYTES } from "@/constants/doctors";
import { useForm } from "@/hooks/useForm";
import { validateDoctor } from "./validateDoctor";

function emptyValues() {
  return {
    name: "",
    specialty: "",
    title: "",
    phone: "",
    email: "",
    avatarUrl: "",
  };
}

function fromDoctor(doctor) {
  return {
    name: doctor.name || "",
    specialty: doctor.specialty || "",
    title: doctor.title || "",
    phone: doctor.phone || "",
    email: doctor.email || "",
    avatarUrl: doctor.avatarUrl || "",
  };
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
        ...values,
        avatarUrl: values.avatarUrl || "",
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
        <TextField label={DOCTOR_TEXT.PHONE} type="tel" autoComplete="off" {...form.getFieldProps("phone")} />
        <TextField label={DOCTOR_TEXT.EMAIL} type="email" autoComplete="off" {...form.getFieldProps("email")} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">{DOCTOR_TEXT.PHOTO}</p>
        <div className="flex items-center gap-3">
          <Avatar name={form.values.name || "Doctor"} src={form.values.avatarUrl || undefined} />
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
      className="max-w-lg"
    >
      <DoctorForm doctor={doctor} onSubmit={onSubmit} onCancel={onClose} />
    </Dialog>
  );
}
