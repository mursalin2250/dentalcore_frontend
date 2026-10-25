import { useEffect, useState } from "react";
import { MagnifyingGlass, PencilSimple, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  FILTER_ALL,
  INVOICE_DIALOGS,
  INVOICE_MESSAGES,
  INVOICE_STAT_CARDS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_OPTIONS,
  INVOICE_STATUS_TONES,
  INVOICE_TEXT,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  SEARCH_DEBOUNCE_MS,
} from "@/constants/billing";
import { CURRENCY } from "@/constants/locale";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, formatNumber, formatShortDate, formatTime } from "@/lib/format";
import { useInvoices } from "./useInvoices";

function takaToMinor(v) {
  return Math.round((Number(v) || 0) * 100);
}
function minorToTaka(v) {
  return Math.round((Number(v) || 0) / 100);
}

function InvoiceFormDialog({ open, invoice, onSubmit, onClose }) {
  const isEdit = Boolean(invoice);
  const [patientOptions, setPatientOptions] = useState([]);
  const form = useForm({
    initialValues: {
      patient: "",
      problem: "",
      treatment: "",
      totalCost: "0",
      notes: "",
    },
    validate: (v) => {
      const e = {};
      if (!isEdit && !v.patient) e.patient = INVOICE_MESSAGES.PATIENT_REQUIRED;
      if (v.totalCost === "" || Number.isNaN(Number(v.totalCost))) e.totalCost = INVOICE_MESSAGES.TOTAL_REQUIRED;
      return e;
    },
    onSubmit: async (values) => {
      const payload = {
        problem: values.problem?.trim() || "",
        treatment: values.treatment?.trim() || "",
        totalCost: takaToMinor(values.totalCost),
        notes: values.notes?.trim() || "",
      };
      if (!isEdit) payload.patient = values.patient;
      await onSubmit(payload);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.reset({
        patient: invoice.patient?.id || "",
        problem: invoice.problem || "",
        treatment: invoice.treatment || "",
        totalCost: String(minorToTaka(invoice.totalCost)),
        notes: invoice.notes || "",
      });
    } else {
      form.reset({ patient: "", problem: "", treatment: "", totalCost: "0", notes: "" });
    }
    const c = new AbortController();
    api(API_ENDPOINTS.PATIENTS, { params: { limit: 50, sort: "-updatedAt" }, signal: c.signal })
      .then((d) => {
        setPatientOptions((d.patients || []).map((p) => ({ value: p.id, label: p.name })));
      })
      .catch(() => {});
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? INVOICE_TEXT.EDIT : INVOICE_TEXT.ADD} className="max-w-lg">
      <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
        {!isEdit && (
          <SearchableSelect
            label="Patient"
            options={patientOptions}
            value={form.values.patient}
            onChange={(v) => form.setValue("patient", v)}
            error={form.errors.patient}
            placeholder="Select patient"
          />
        )}
        {isEdit && (
          <p className="text-sm text-muted-foreground">
            Patient: <span className="font-medium text-foreground">{invoice.patient?.name}</span>
          </p>
        )}
        <TextField label="Problem" {...form.getFieldProps("problem")} />
        <TextField label="Treatment" {...form.getFieldProps("treatment")} />
        <TextField label="Total cost (BDT)" type="number" min={0} {...form.getFieldProps("totalCost")} />
        <TextField label="Notes" {...form.getFieldProps("notes")} />
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            {isEdit ? "Save changes" : INVOICE_TEXT.ADD}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PaymentFormDialog({ open, invoice, onSubmit, onClose }) {
  const form = useForm({
    initialValues: { amount: "", method: "cash", note: "" },
    validate: (v) => {
      const e = {};
      if (!v.amount || Number(v.amount) <= 0) e.amount = INVOICE_MESSAGES.AMOUNT_REQUIRED;
      if (!v.method) e.method = INVOICE_MESSAGES.METHOD_REQUIRED;
      const due = minorToTaka(invoice?.amountDue || 0);
      if (due > 0 && Number(v.amount) > due) e.amount = "Amount exceeds balance due.";
      return e;
    },
    onSubmit: async (values) => {
      const amountMinor = takaToMinor(values.amount);
      if (!Number.isFinite(amountMinor) || amountMinor < 1) {
        throw Object.assign(new Error("Enter a valid amount."), {
          fieldErrors: { amount: "Enter a valid amount in BDT." },
        });
      }
      await onSubmit({
        amount: amountMinor,
        method: values.method || "cash",
        note: values.note?.trim() || "",
      });
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ amount: String(minorToTaka(invoice?.amountDue || 0) || ""), method: "cash", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  if (!invoice) return null;
  return (
    <Dialog open={open} onClose={onClose} title={INVOICE_TEXT.RECORD_PAYMENT} className="max-w-md">
      <form noValidate onSubmit={form.handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {invoice.invoiceNumber} · Due{" "}
          <span className="font-medium text-foreground">{formatMoney(invoice.amountDue, CURRENCY)}</span>
        </p>
        <TextField label="Amount (BDT)" type="number" min={0} step={1} {...form.getFieldProps("amount")} />
        <SelectField label="Method" options={PAYMENT_METHOD_OPTIONS} {...form.getFieldProps("method")} />
        <TextField label="Note" {...form.getFieldProps("note")} />
        {form.formError && <FormError>{form.formError}</FormError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            {INVOICE_TEXT.RECORD_PAYMENT}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function InvoiceDetailsDialog({ open, invoice, onClose, onPayment }) {
  if (!invoice) return null;
  return (
    <Dialog open={open} onClose={onClose} title={INVOICE_TEXT.DETAILS_TITLE} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={INVOICE_STATUS_TONES[invoice.status] || "neutral"}>
            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
          </Badge>
          <span className="text-sm tabular-nums text-muted-foreground">{invoice.invoiceNumber}</span>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Patient</dt>
            <dd className="font-medium">{invoice.patient?.name || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{INVOICE_TEXT.TOTAL_COST}</dt>
            <dd className="tabular-nums font-medium">{formatMoney(invoice.totalCost, CURRENCY)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{INVOICE_TEXT.AMOUNT_PAID}</dt>
            <dd className="tabular-nums font-medium">{formatMoney(invoice.amountPaid, CURRENCY)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{INVOICE_TEXT.AMOUNT_DUE}</dt>
            <dd className="tabular-nums font-medium">{formatMoney(invoice.amountDue, CURRENCY)}</dd>
          </div>
          {(invoice.problem || invoice.treatment) && (
            <div>
              <dt className="text-muted-foreground">Care</dt>
              <dd className="mt-1">{[invoice.problem, invoice.treatment].filter(Boolean).join(" · ")}</dd>
            </div>
          )}
        </dl>
        <div>
          <h3 className="text-sm font-semibold">Payments</h3>
          {(invoice.payments || []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto border-t border-border pt-2">
              {invoice.payments.map((p) => (
                <li
                  key={p.id}
                  className={`rounded-lg border border-border px-3 py-2 text-sm ${p.isVoided ? "opacity-50 line-through" : ""}`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium tabular-nums">{formatMoney(p.amount, CURRENCY)}</span>
                    <span className="text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method] || p.method}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.paidAt ? `${formatShortDate(p.paidAt)} · ${formatTime(p.paidAt)}` : ""}
                    {p.recordedBy?.name ? ` · ${p.recordedBy.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {invoice.status !== "cancelled" && invoice.amountDue > 0 && (
            <Button type="button" onClick={() => onPayment?.(invoice)}>
              {INVOICE_TEXT.RECORD_PAYMENT}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default function InvoicePage() {
  usePageTitle(INVOICE_TEXT.LIST_TITLE);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(FILTER_ALL);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ type: null, invoice: null });
  const [announcement, setAnnouncement] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const state = useInvoices({ search, status, page });

  const statusOptions = [{ value: FILTER_ALL, label: "All statuses" }, ...INVOICE_STATUS_OPTIONS];

  const handleCreate = async (values) => {
    await state.createInvoice(values);
    setAnnouncement(INVOICE_MESSAGES.CREATED);
  };
  const handleEdit = async (values) => {
    await state.updateInvoice(dialog.invoice.id, values);
    setAnnouncement(INVOICE_MESSAGES.UPDATED);
  };
  const handlePayment = async (values) => {
    await state.addPayment(dialog.invoice.id, values);
    setAnnouncement(INVOICE_MESSAGES.PAYMENT_ADDED);
  };
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await state.removeInvoice(dialog.invoice.id);
      setAnnouncement(INVOICE_MESSAGES.DELETED);
      setDialog({ type: null });
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{INVOICE_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{INVOICE_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <Button onClick={() => setDialog({ type: INVOICE_DIALOGS.ADD })}>
          <Plus /> {INVOICE_TEXT.ADD}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INVOICE_STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            index={i + 1}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            isLoading={state.statsLoading}
            value={
              state.stats
                ? card.money
                  ? formatMoney(state.stats[card.key] ?? 0, CURRENCY)
                  : formatNumber(state.stats[card.key] ?? 0)
                : undefined
            }
          />
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[12rem] flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label={INVOICE_TEXT.SEARCH_PLACEHOLDER}
              placeholder={INVOICE_TEXT.SEARCH_PLACEHOLDER}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className={`${INPUT_CLASS} border-border pl-9`}
            />
          </div>
          <SelectField
            label=""
            hideLabel
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
        </div>

        {state.error && (
          <div className="mt-4">
            <EmptyState
              icon={WarningCircle}
              title="Could not load invoices"
              description={state.error.message}
              action={
                <Button variant="secondary" onClick={state.reload}>
                  Try again
                </Button>
              }
            />
          </div>
        )}
        {!state.error && state.isLoading && (
          <div className="mt-4 space-y-2" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!state.error && !state.isLoading && state.invoices.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={WarningCircle}
              title={search || status !== FILTER_ALL ? INVOICE_TEXT.EMPTY_FILTER_TITLE : INVOICE_TEXT.EMPTY_TITLE}
              description={
                search || status !== FILTER_ALL
                  ? INVOICE_TEXT.EMPTY_FILTER_DESCRIPTION
                  : INVOICE_TEXT.EMPTY_DESCRIPTION
              }
            />
          </div>
        )}
        {!state.error && !state.isLoading && state.invoices.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Invoice</th>
                    <th className="py-2 pr-3 font-medium">Patient</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 pr-3 font-medium">Paid</th>
                    <th className="py-2 pr-3 font-medium">Due</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.invoices.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                      onClick={() => setDialog({ type: INVOICE_DIALOGS.DETAILS, invoice: row })}
                    >
                      <td className="py-2.5 pr-3">
                        <p className="font-medium tabular-nums">{row.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.updatedAt ? formatShortDate(row.updatedAt) : ""}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{row.patient?.name || "—"}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.totalCost, CURRENCY)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.amountPaid, CURRENCY)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.amountDue, CURRENCY)}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={INVOICE_STATUS_TONES[row.status] || "neutral"}>
                          {INVOICE_STATUS_LABELS[row.status] || row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <IconButton
                            label="Edit"
                            className="size-8"
                            onClick={() => setDialog({ type: INVOICE_DIALOGS.EDIT, invoice: row })}
                          >
                            <PencilSimple className="size-4" />
                          </IconButton>
                          {row.status !== "cancelled" && row.amountDue > 0 && (
                            <IconButton
                              label="Payment"
                              className="size-8"
                              onClick={() => setDialog({ type: INVOICE_DIALOGS.PAYMENT, invoice: row })}
                            >
                              <Plus className="size-4" />
                            </IconButton>
                          )}
                          <IconButton
                            label="Delete"
                            className="size-8"
                            onClick={() => {
                              setDeleteError("");
                              setDialog({ type: INVOICE_DIALOGS.DELETE, invoice: row });
                            }}
                          >
                            <Trash className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={state.pagination.totalPages}
              total={state.pagination.total}
              onPageChange={setPage}
              itemLabel="invoices"
            />
          </>
        )}
      </section>

      <InvoiceFormDialog
        open={dialog.type === INVOICE_DIALOGS.ADD}
        onSubmit={handleCreate}
        onClose={() => setDialog({ type: null })}
      />
      <InvoiceFormDialog
        open={dialog.type === INVOICE_DIALOGS.EDIT}
        invoice={dialog.invoice}
        onSubmit={handleEdit}
        onClose={() => setDialog({ type: null })}
      />
      <PaymentFormDialog
        open={dialog.type === INVOICE_DIALOGS.PAYMENT}
        invoice={dialog.invoice}
        onSubmit={handlePayment}
        onClose={() => setDialog({ type: null })}
      />
      <InvoiceDetailsDialog
        open={dialog.type === INVOICE_DIALOGS.DETAILS}
        invoice={dialog.invoice}
        onClose={() => setDialog({ type: null })}
        onPayment={(inv) => setDialog({ type: INVOICE_DIALOGS.PAYMENT, invoice: inv })}
      />
      <ConfirmDialog
        open={dialog.type === INVOICE_DIALOGS.DELETE}
        onClose={() => setDialog({ type: null })}
        onConfirm={handleDelete}
        title="Delete invoice"
        description={INVOICE_MESSAGES.DELETE_DESCRIPTION}
        confirmLabel="Delete"
        loading={deleteLoading}
        error={deleteError}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
