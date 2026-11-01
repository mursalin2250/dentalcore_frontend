import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import DateField from "@/components/ui/DateField";
import SelectField from "@/components/ui/SelectField";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { CURRENCY } from "@/constants/locale";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  SHIFT_OPTIONS,
  STAFF_ROLE_OPTIONS,
  WEEKDAY_LABELS,
} from "@/constants/staff";
import { useForm } from "@/hooks/useForm";
import { api } from "@/lib/api";
import { takaToMinor, minorToTaka } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "inactive", label: "Inactive" },
];

function WorkingDaysPicker({ value, onChange }) {
  const selected = new Set(value || []);
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Working days</legend>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_LABELS.map((label, day) => {
          const checked = selected.has(day);
          return (
            <label
              key={label}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
                checked
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40"
              }`}
            >
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={checked}
                onChange={() => {
                  const next = new Set(selected);
                  if (checked) next.delete(day);
                  else next.add(day);
                  onChange([...next].sort((a, b) => a - b));
                }}
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function StaffFormDialog({ open, staff, onClose, onSaved }) {
  const isEdit = Boolean(staff);
  const form = useForm({
    initialValues: {
      name: "",
      designation: "",
      department: "",
      phone: "",
      email: "",
      address: "",
      employmentType: "full_time",
      staffRole: "other",
      baseSalary: "",
      shiftName: "morning",
      startTime: "09:00",
      endTime: "17:00",
      workingDays: [0, 1, 2, 3, 4],
      status: "active",
      leaveDays: "0",
      leaveStartDate: "",
      notes: "",
    },
    validate: (v) => {
      const e = {};
      if (!v.name?.trim()) e.name = "Enter a name.";
      return e;
    },
    onSubmit: async (values) => {
      const body = {
        name: values.name.trim(),
        designation: values.designation.trim(),
        department: values.department.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        employmentType: values.employmentType,
        staffRole: values.staffRole,
        baseSalary: takaToMinor(values.baseSalary),
        shift: {
          name: values.shiftName,
          startTime: values.startTime,
          endTime: values.endTime,
          workingDays: values.workingDays || [],
        },
        status: values.status,
        leaveDays: values.status === "on_leave" ? Math.max(0, Math.round(Number(values.leaveDays) || 0)) : 0,
        leaveStartDate: values.status === "on_leave" && values.leaveStartDate ? values.leaveStartDate : null,
        notes: values.notes.trim(),
      };
      if (isEdit) {
        await api(API_ENDPOINTS.staff(staff.id), { method: HTTP_METHODS.PATCH, body });
      } else {
        await api(API_ENDPOINTS.STAFF, { method: HTTP_METHODS.POST, body });
      }
      onSaved();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    if (staff) {
      form.reset({
        name: staff.name || "",
        designation: staff.designation || "",
        department: staff.department || "",
        phone: staff.phone || "",
        email: staff.email || "",
        address: staff.address || "",
        employmentType: staff.employmentType || "full_time",
        staffRole: staff.staffRole || "other",
        baseSalary: staff.baseSalary != null ? String(minorToTaka(staff.baseSalary)) : "",
        shiftName: staff.shift?.name || "morning",
        startTime: staff.shift?.startTime || "09:00",
        endTime: staff.shift?.endTime || "17:00",
        workingDays: staff.shift?.workingDays || [0, 1, 2, 3, 4],
        status: staff.status || "active",
        leaveDays: String(staff.leaveDays ?? 0),
        leaveStartDate: staff.leaveStartDate
          ? String(staff.leaveStartDate).slice(0, 10)
          : "",
        notes: staff.notes || "",
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, staff]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit staff" : "Add staff"} className="max-w-lg">
      <form onSubmit={form.handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <TextField label="Name" {...form.getFieldProps("name")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Employee type" options={STAFF_ROLE_OPTIONS} {...form.getFieldProps("staffRole")} />
          <TextField label="Designation" {...form.getFieldProps("designation")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Department" {...form.getFieldProps("department")} />
          <SelectField label="Employment" options={EMPLOYMENT_TYPE_OPTIONS} {...form.getFieldProps("employmentType")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Phone" {...form.getFieldProps("phone")} />
          <TextField label="Email" {...form.getFieldProps("email")} />
        </div>
        <TextField label="Address" {...form.getFieldProps("address")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={`Base salary (${CURRENCY}/mo)`} type="number" min={0} {...form.getFieldProps("baseSalary")} />
          <SelectField label="Status" options={STATUS_OPTIONS} {...form.getFieldProps("status")} />
        </div>
        {form.values.status === "on_leave" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label="Leave starts" {...form.getFieldProps("leaveStartDate")} />
            <TextField
              label="Leave days"
              type="number"
              min={1}
              {...form.getFieldProps("leaveDays")}
              hint="Number of days on leave from the start date"
            />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField label="Shift" options={SHIFT_OPTIONS} {...form.getFieldProps("shiftName")} />
          <TextField label="Start" {...form.getFieldProps("startTime")} />
          <TextField label="End" {...form.getFieldProps("endTime")} />
        </div>
        <WorkingDaysPicker
          value={form.values.workingDays}
          onChange={(days) => form.setValue("workingDays", days)}
        />
        <TextField label="Notes" {...form.getFieldProps("notes")} />
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
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
