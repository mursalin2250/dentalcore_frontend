import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  MOVEMENT_MESSAGES,
  MOVEMENT_REASONS,
  MOVEMENT_TEXT,
  STOCK_MOVEMENT_TYPE_OPTIONS,
  STOCK_MOVEMENT_TYPES,
} from "@/constants/inventory";
import { useForm } from "@/hooks/useForm";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";

function emptyValues() {
  return {
    medication: "",
    type: STOCK_MOVEMENT_TYPES.IN,
    quantity: "1",
    countedQuantity: "0",
    reason: MOVEMENT_REASONS[STOCK_MOVEMENT_TYPES.IN][0],
    note: "",
    reference: "",
  };
}

export default function MovementFormDialog({ open, onSubmit, onClose }) {
  const [medOptions, setMedOptions] = useState([]);
  const [stockMap, setStockMap] = useState({});

  const form = useForm({
    initialValues: emptyValues(),
    validate: (values) => {
      const errors = {};
      if (!values.medication) errors.medication = MOVEMENT_MESSAGES.MEDICATION_REQUIRED;
      if (values.type === STOCK_MOVEMENT_TYPES.ADJUST) {
        if (values.countedQuantity === "" || Number.isNaN(Number(values.countedQuantity))) {
          errors.countedQuantity = MOVEMENT_MESSAGES.COUNTED_REQUIRED;
        }
      } else if (!values.quantity || Number(values.quantity) < 1) {
        errors.quantity = MOVEMENT_MESSAGES.QUANTITY_REQUIRED;
      }
      if (!values.reason) errors.reason = MOVEMENT_MESSAGES.REASON_REQUIRED;
      const current = stockMap[values.medication]?.stock ?? 0;
      if (values.type === STOCK_MOVEMENT_TYPES.OUT && Number(values.quantity) > current) {
        errors.quantity = MOVEMENT_MESSAGES.INSUFFICIENT;
      }
      return errors;
    },
    onSubmit: async (values) => {
      const payload = {
        medication: values.medication,
        type: values.type,
        reason: values.reason,
        note: values.note?.trim() || "",
        reference: values.reference?.trim() || "",
      };
      if (values.type === STOCK_MOVEMENT_TYPES.ADJUST) {
        payload.countedQuantity = Number(values.countedQuantity);
      } else {
        payload.quantity = Number(values.quantity);
      }
      await onSubmit(payload);
      onClose();
    },
  });
  useEffect(() => {
    if (!open) return;
    form.reset(emptyValues());
    const c = new AbortController();
    api(API_ENDPOINTS.MEDICATIONS, { params: { limit: 50, sort: "name" }, signal: c.signal })
      .then((data) => {
        const list = data.medications || [];
        setMedOptions(list.map((m) => ({ value: m.id, label: `${m.name} (${m.sku})` })));
        setStockMap(Object.fromEntries(list.map((m) => [m.id, { stock: m.stock, unit: m.unit }])));
      })
      .catch(() => {});
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reasons = MOVEMENT_REASONS[form.values.type] || [];
  const reasonOptions = reasons.map((r) => ({ value: r, label: r }));

  useEffect(() => {
    const list = MOVEMENT_REASONS[form.values.type] || [];
    if (!list.includes(form.values.reason)) {
      form.setValue("reason", list[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.type]);

  const currentStock = stockMap[form.values.medication]?.stock ?? null;
  const unit = stockMap[form.values.medication]?.unit || "";

  const resulting = useMemo(() => {
    if (currentStock === null || currentStock === undefined) return null;
    if (form.values.type === STOCK_MOVEMENT_TYPES.IN) {
      return currentStock + (Number(form.values.quantity) || 0);
    }
    if (form.values.type === STOCK_MOVEMENT_TYPES.OUT) {
      return currentStock - (Number(form.values.quantity) || 0);
    }
    return Number(form.values.countedQuantity) || 0;
  }, [currentStock, form.values.type, form.values.quantity, form.values.countedQuantity]);

  return (
    <Dialog open={open} onClose={onClose} title={MOVEMENT_TEXT.ADD} className="max-w-lg">
      <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
        <SearchableSelect
          label="Medication"
          options={medOptions}
          value={form.values.medication}
          onChange={(v) => form.setValue("medication", v)}
          error={form.errors.medication}
          placeholder="Search medication"
        />
        {currentStock !== null && form.values.medication && (
          <p className="text-sm text-muted-foreground">
            Current stock: <span className="font-medium text-foreground">{formatNumber(currentStock)} {unit}</span>
          </p>
        )}
        <SelectField
          label="Type"
          options={STOCK_MOVEMENT_TYPE_OPTIONS}
          {...form.getFieldProps("type")}
        />
        {form.values.type === STOCK_MOVEMENT_TYPES.ADJUST ? (
          <TextField
            label={MOVEMENT_TEXT.COUNTED_QTY}
            type="number"
            min={0}
            {...form.getFieldProps("countedQuantity")}
          />
        ) : (
          <TextField label={MOVEMENT_TEXT.QUANTITY} type="number" min={1} {...form.getFieldProps("quantity")} />
        )}
        {resulting !== null && form.values.medication && (
          <p className="text-sm">
            {MOVEMENT_TEXT.RESULTING_STOCK}:{" "}
            <span className={`font-medium tabular-nums ${resulting < 0 ? "text-danger" : ""}`}>
              {formatNumber(resulting)} {unit}
            </span>
          </p>
        )}
        <SelectField label="Reason" options={reasonOptions} {...form.getFieldProps("reason")} />
        <TextField label="Note" {...form.getFieldProps("note")} />
        <TextField label="Reference" hint="Invoice or PO number" {...form.getFieldProps("reference")} />
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting} disabled={resulting !== null && resulting < 0}>
            {MOVEMENT_TEXT.ADD}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
