import { useEffect, useState } from "react";
import { MagnifyingGlass, Package, PencilSimple, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import {
  ITEM_TYPE_OPTIONS,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_TONES,
  UNIT_OPTIONS,
} from "@/constants/inventory";
import { CURRENCY, CURRENCY_MINOR_UNIT } from "@/constants/locale";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, takaToMinor, minorToTaka } from "@/lib/format";


function MedFormDialog({ open, medication, onClose, onSaved }) {
  const isEdit = Boolean(medication);
  const form = useForm({
    initialValues: {
      name: "",
      sku: "",
      itemType: "medicine",
      category: "",
      unit: "pcs",
      quantity: "0",
      reorderLevel: "0",
      unitPrice: "0",
      supplier: "",
    },
    validate: (v) => {
      const e = {};
      if (!v.name?.trim()) e.name = "Enter a name.";
      return e;
    },
    onSubmit: async (values) => {
      const body = {
        name: values.name.trim(),
        sku: values.sku.trim(),
        itemType: values.itemType,
        category: values.category.trim(),
        unit: values.unit,
        reorderLevel: Math.max(0, Math.round(Number(values.reorderLevel) || 0)),
        unitPrice: takaToMinor(values.unitPrice),
        supplier: values.supplier.trim(),
      };
      if (!isEdit) body.quantity = Math.max(0, Math.round(Number(values.quantity) || 0));
      if (isEdit) {
        await api(API_ENDPOINTS.medication(medication.id), { method: HTTP_METHODS.PATCH, body });
      } else {
        await api(API_ENDPOINTS.MEDICATIONS, { method: HTTP_METHODS.POST, body });
      }
      onSaved();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    if (medication) {
      form.reset({
        name: medication.name || "",
        sku: medication.sku || "",
        itemType: medication.itemType || "medicine",
        category: medication.category || "",
        unit: medication.unit || "pcs",
        quantity: String(medication.quantity ?? 0),
        reorderLevel: String(medication.reorderLevel ?? 0),
        unitPrice: String(minorToTaka(medication.unitPrice || 0)),
        supplier: medication.supplier || "",
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        itemType: "medicine",
        category: "",
        unit: "pcs",
        quantity: "0",
        reorderLevel: "0",
        unitPrice: "0",
        supplier: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medication?.id]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit medication" : "New medication"} className="max-w-lg">
      <form onSubmit={form.handleSubmit} className="space-y-3">
        <TextField label="Name" {...form.getFieldProps("name")} />
        <TextField label="SKU" placeholder="Auto if blank" {...form.getFieldProps("sku")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Type" options={ITEM_TYPE_OPTIONS} {...form.getFieldProps("itemType")} />
          <SelectField label="Unit" options={UNIT_OPTIONS} {...form.getFieldProps("unit")} />
        </div>
        <TextField label="Category" {...form.getFieldProps("category")} />
        <div className="grid gap-3 sm:grid-cols-2">
          {!isEdit && (
            <TextField label="Initial stock" type="number" min={0} {...form.getFieldProps("quantity")} />
          )}
          <TextField label="Reorder level" type="number" min={0} {...form.getFieldProps("reorderLevel")} />
          <TextField label={`Unit price (${CURRENCY})`} type="number" min={0} {...form.getFieldProps("unitPrice")} />
        </div>
        <TextField label="Supplier" {...form.getFieldProps("supplier")} />
        {isEdit && (
          <p className="text-xs text-muted-foreground">Stock is changed only via Stock Movement.</p>
        )}
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function MedicationsPage() {
  usePageTitle("Medications");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState({ type: null, med: null });
  const search = useDebouncedValue(query, 300).trim();

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      api(API_ENDPOINTS.MEDICATIONS, {
        params: { search: search || undefined, page, limit: 12, sort: "-updatedAt" },
        signal: c.signal,
      }),
      api(API_ENDPOINTS.MEDICATIONS_STATS, { signal: c.signal }),
    ])
      .then(([list, st]) => {
        setRows(list.medications || []);
        setPagination(list.pagination || { page: 1, pages: 1, total: 0 });
        setStats(st);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [search, statusFilter, typeFilter, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleDelete = async () => {
    await api(API_ENDPOINTS.medication(dialog.med.id), { method: HTTP_METHODS.DELETE });
    setDialog({ type: null, med: null });
    reload();
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Medicines and dental supplies in stock.</p>
        </div>
        <Button onClick={() => setDialog({ type: "form", med: null })}>
          <Plus className="size-4" /> New medication
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={1} label="Total items" icon={Package} isLoading={!stats} value={stats ? String(stats.totalItems) : undefined} />
        <StatCard index={2} label="Low stock" icon={WarningCircle} tone="warning" isLoading={!stats} value={stats ? String(stats.lowStockCount) : undefined} />
        <StatCard index={3} label="Out of stock" icon={WarningCircle} tone="danger" isLoading={!stats} value={stats ? String(stats.outOfStockCount) : undefined} />
        <StatCard index={4} label="Inventory value" icon={Package} isLoading={!stats} value={stats ? formatMoney(stats.inventoryValue, CURRENCY) : undefined} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-md">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${INPUT_CLASS} border-border pl-9`}
            placeholder="Search name, SKU, category…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label="Status"
          hideLabel
          className="w-full sm:w-40"
          options={[
            { value: "", label: "All statuses" },
            ...Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        />
        <SelectField
          label="Type"
          hideLabel
          className="w-full sm:w-40"
          options={[{ value: "", label: "All types" }, ...ITEM_TYPE_OPTIONS]}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState icon={WarningCircle} title="Could not load medications" description={error.message} action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
        </div>
      )}

      {!error && loading && (
        <div className="mt-6 space-y-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!error && !loading && rows.length === 0 && (
        <div className="mt-10">
          <EmptyState title="No medications" description="Add medicines and tools to track stock." action={<Button onClick={() => setDialog({ type: "form", med: null })}><Plus className="size-4" /> New medication</Button>} />
        </div>
      )}

      {!error && !loading && rows.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Unit price</th>
                  <th className="px-4 py-3 font-medium">Total price</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.sku || "—"}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.quantity} {row.unit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STOCK_STATUS_TONES[row.status] || "neutral"}>
                        {STOCK_STATUS_LABELS[row.status] || row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.unitPrice, CURRENCY)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.totalPrice, CURRENCY)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <IconButton label="Edit" className="size-8" onClick={() => setDialog({ type: "form", med: row })}>
                          <PencilSimple className="size-4" />
                        </IconButton>
                        <IconButton label="Delete" className="size-8" onClick={() => setDialog({ type: "delete", med: row })}>
                          <Trash className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total} onPageChange={setPage} itemLabel="items" />
        </>
      )}

      <MedFormDialog
        open={dialog.type === "form"}
        medication={dialog.med}
        onClose={() => setDialog({ type: null, med: null })}
        onSaved={reload}
      />
      <ConfirmDialog
        open={dialog.type === "delete"}
        onClose={() => setDialog({ type: null, med: null })}
        onConfirm={handleDelete}
        title="Delete medication?"
        description="If it has movement history it will be archived instead."
        confirmLabel="Delete"
      />
    </div>
  );
}
