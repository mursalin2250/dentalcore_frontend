import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import DateField from "@/components/ui/DateField";
import {
  MEDICATION_CATEGORY_OPTIONS,
  MEDICATION_ITEM_TYPE_OPTIONS,
  MEDICATION_MESSAGES,
  MEDICATION_TEXT,
  MEDICATION_UNIT_OPTIONS,
} from "@/constants/inventory";
import { useForm } from "@/hooks/useForm";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function emptyValues() {
  return {
    name: "",
    sku: "",
    itemType: "medicine",
    category: "Other",
    unit: "pcs",
    initialStock: "0",
    reorderLevel: "0",
    unitPrice: "0",
    expiryDate: "",
    supplier: "",
  };
}

function fromMedication(m) {
  return {
    name: m.name || "",
    sku: m.sku || "",
    itemType: m.itemType || "medicine",
    category: m.category || "Other",
    unit: m.unit || "pcs",
    reorderLevel: String(m.reorderLevel ?? 0),
    unitPrice: String(Math.round((Number(m.unitPrice) || 0) / 100)),
    expiryDate: m.expiryDate ? String(m.expiryDate).slice(0, 10) : "",
    supplier: m.supplier || "",
    stock: m.stock ?? 0,
  };
}

function validate(values, isEdit) {
  const errors = {};
  if (!values.name?.trim()) errors.name = MEDICATION_MESSAGES.NAME_REQUIRED;
  return errors;
}

function FormBody({ form, isEdit, medication, onClose }) {
  return (
    <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
      <TextField label="Name" {...form.getFieldProps("name")} />
      <TextField label="SKU" hint={isEdit ? undefined : "Leave blank to auto-generate"} {...form.getFieldProps("sku")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Type" options={MEDICATION_ITEM_TYPE_OPTIONS} {...form.getFieldProps("itemType")} />
        <SelectField label="Category" options={MEDICATION_CATEGORY_OPTIONS} {...form.getFieldProps("category")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Unit" options={MEDICATION_UNIT_OPTIONS} {...form.getFieldProps("unit")} />
        {!isEdit && <TextField label="Initial stock" type="number" min={0} {...form.getFieldProps("initialStock")} />}
      </div>
      {isEdit && (
        <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">
            {MEDICATION_TEXT.CURRENT_STOCK}: {medication?.stock ?? 0} {medication?.unit}
          </p>
          <p className="mt-1 text-muted-foreground">{MEDICATION_TEXT.STOCK_READONLY}</p>
          <Link to={ROUTES.STOCK_MOVEMENT} className="mt-1 inline-block text-primary hover:underline">
            {MEDICATION_TEXT.RECORD_MOVEMENT}
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Reorder level" type="number" min={0} {...form.getFieldProps("reorderLevel")} />
        <TextField label="Unit price (BDT)" type="number" min={0} step={1} {...form.getFieldProps("unitPrice")} />
      </div>
      <DateField label="Expiry date" {...form.getFieldProps("expiryDate")} />
      <TextField label="Supplier" {...form.getFieldProps("supplier")} />
      {form.formError && <FormError>{form.formError}</FormError>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={form.isSubmitting}>
          {isEdit ? "Save changes" : MEDICATION_TEXT.ADD}
        </Button>
      </div>
    </form>
  );
}

export default function MedicationFormDialog({ open, medication, onSubmit, onClose }) {
  const isEdit = Boolean(medication);
  const form = useForm({
    initialValues: emptyValues(),
    validate: (v) => validate(v, isEdit),
    onSubmit: async (values) => {
      const payload = {
        name: values.name.trim(),
        sku: values.sku.trim(),
        itemType: values.itemType,
        category: values.category,
        unit: values.unit,
        reorderLevel: Number(values.reorderLevel) || 0,
        unitPrice: Math.round((Number(values.unitPrice) || 0) * 100),
        expiryDate: values.expiryDate || null,
        supplier: values.supplier?.trim() || "",
      };
      if (!isEdit) payload.initialStock = Number(values.initialStock) || 0;
      await onSubmit(payload);
      onClose();
    },
  });
    useEffect(() => {
    if (!open) return;
    form.reset(isEdit ? fromMedication(medication) : emptyValues());
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [open, medication?.id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? MEDICATION_TEXT.EDIT : MEDICATION_TEXT.ADD}
      className="max-w-lg"
    >
      <FormBody form={form} isEdit={isEdit} medication={medication} onClose={onClose} />
    </Dialog>
  );
}
