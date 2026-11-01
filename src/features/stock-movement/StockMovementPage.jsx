import { useEffect, useMemo, useState } from "react";
import { ArrowsLeftRight, MagnifyingGlass, Plus, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import {
  STOCK_MOVEMENT_LABELS,
  STOCK_MOVEMENT_TONES,
  STOCK_MOVEMENT_TYPES,
} from "@/constants/inventory";
import { CURRENCY } from "@/constants/locale";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, formatShortDate, formatTime } from "@/lib/format";

const TYPE_OPTIONS = [
  { value: STOCK_MOVEMENT_TYPES.IN, label: STOCK_MOVEMENT_LABELS.in },
  { value: STOCK_MOVEMENT_TYPES.OUT, label: STOCK_MOVEMENT_LABELS.out },
  { value: STOCK_MOVEMENT_TYPES.ADJUST, label: STOCK_MOVEMENT_LABELS.adjust },
];

function MovementFormDialog({ open, medications, onClose, onSaved }) {
  const form = useForm({
    initialValues: { medication: "", type: "in", quantity: "1", reason: "", note: "" },
    validate: (v) => {
      const e = {};
      if (!v.medication) e.medication = "Select a medication.";
      if (!v.quantity || Number(v.quantity) < 1) e.quantity = "Enter a quantity.";
      const med = medications.find((m) => m.id === v.medication);
      if (v.type === "out" && med && Number(v.quantity) > med.quantity) {
        e.quantity = `Only ${med.quantity} in stock.`;
      }
      return e;
    },
    onSubmit: async (values) => {
      await api(API_ENDPOINTS.STOCK_MOVEMENTS, {
        method: HTTP_METHODS.POST,
        body: {
          medication: values.medication,
          type: values.type,
          quantity: Math.round(Number(values.quantity)),
          reason: values.reason?.trim() || "",
          note: values.note?.trim() || "",
        },
      });
      onSaved();
      onClose();
    },
  });

  const selected = medications.find((m) => m.id === form.values.medication);
  const previewAfter = useMemo(() => {
    if (!selected) return null;
    const q = Math.round(Number(form.values.quantity) || 0);
    if (form.values.type === "in") return selected.quantity + q;
    if (form.values.type === "out") return Math.max(0, selected.quantity - q);
    if (form.values.type === "adjust") return q;
    return selected.quantity;
  }, [selected, form.values.quantity, form.values.type]);

  useEffect(() => {
    if (open) form.reset({ medication: "", type: "in", quantity: "1", reason: "", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const medOptions = medications.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.quantity} ${m.unit})`,
  }));

  return (
    <Dialog open={open} onClose={onClose} title="New movement" className="max-w-md">
      <form onSubmit={form.handleSubmit} className="space-y-3">
        <SelectField label="Medication" options={[{ value: "", label: "Select…" }, ...medOptions]} {...form.getFieldProps("medication")} />
        <SelectField label="Type" options={TYPE_OPTIONS} {...form.getFieldProps("type")} />
        <TextField
          label={form.values.type === "adjust" ? "Counted quantity" : "Quantity"}
          type="number"
          min={1}
          {...form.getFieldProps("quantity")}
        />
        {selected && (
          <p className="text-sm text-muted-foreground">
            Stock: <span className="font-medium text-foreground">{selected.quantity}</span>
            {previewAfter != null && (
              <>
                {" "}
                → <span className="font-medium text-foreground">{previewAfter}</span>
              </>
            )}
          </p>
        )}
        <TextField label="Reason" {...form.getFieldProps("reason")} />
        <TextField label="Note" {...form.getFieldProps("note")} />
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            Record
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function StockMovementPage() {
  usePageTitle("Stock Movement");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const search = useDebouncedValue(query, 300).trim();

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      api(API_ENDPOINTS.STOCK_MOVEMENTS, {
        params: {
          search: search || undefined,
          type: type !== "all" ? type : undefined,
          page,
          limit: 12,
        },
        signal: c.signal,
      }),
      api(API_ENDPOINTS.STOCK_MOVEMENTS_STATS, { signal: c.signal }),
      api(API_ENDPOINTS.MEDICATIONS, { params: { limit: 50, sort: "name" }, signal: c.signal }),
    ])
      .then(([list, st, meds]) => {
        setRows(list.movements || []);
        setPagination(list.pagination || { page: 1, pages: 1, total: 0 });
        setStats(st);
        setMedications(meds.medications || []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [search, type, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Movement</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log stock in, stock out, and stock adjustment.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> New movement
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={1} label="Movements today" icon={ArrowsLeftRight} isLoading={!stats} value={stats ? String(stats.movementsToday) : undefined} />
        <StatCard index={2} label="Stock in (30d)" icon={ArrowsLeftRight} tone="success" isLoading={!stats} value={stats ? String(stats.stockIn30d) : undefined} />
        <StatCard index={3} label="Stock out (30d)" icon={ArrowsLeftRight} tone="danger" isLoading={!stats} value={stats ? String(stats.stockOut30d) : undefined} />
        <StatCard index={4} label="Adjustments (30d)" icon={ArrowsLeftRight} tone="warning" isLoading={!stats} value={stats ? String(stats.adjustments30d) : undefined} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${INPUT_CLASS} border-border pl-9`}
            placeholder="Search by medication…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          label="Type"
          hideLabel
          className="w-44"
          options={[{ value: "all", label: "All types" }, ...TYPE_OPTIONS]}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && (
        <div className="mt-6">
          <EmptyState icon={WarningCircle} title="Could not load movements" description={error.message} action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
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
          <EmptyState title="No movements yet" description="Record stock in, out, or adjustments." action={<Button onClick={() => setFormOpen(true)}><Plus className="size-4" /> New movement</Button>} />
        </div>
      )}

      {!error && !loading && rows.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Medication</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Total cost</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {row.createdAt ? `${formatShortDate(row.createdAt)} ${formatTime(row.createdAt)}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.medication?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STOCK_MOVEMENT_TONES[row.type] || "neutral"}>
                        {STOCK_MOVEMENT_LABELS[row.type] || row.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.stockBefore} → {row.stockAfter}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.totalCost || 0, CURRENCY)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total} onPageChange={setPage} itemLabel="movements" />
        </>
      )}

      <MovementFormDialog open={formOpen} medications={medications} onClose={() => setFormOpen(false)} onSaved={reload} />
    </div>
  );
}
