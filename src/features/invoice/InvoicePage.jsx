import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Printer,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
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
import {
  FILTER_ALL,
  INVOICE_DIALOGS,
  INVOICE_MESSAGES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_OPTIONS,
  INVOICE_STATUS_TONES,
  INVOICE_TEXT,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  SEARCH_DEBOUNCE_MS,
} from "@/constants/billing";
import { CURRENCY, CURRENCY_MINOR_UNIT } from "@/constants/locale";
import { ROUTES } from "@/constants/routes";
import { useInvoices } from "@/features/invoice/useInvoices";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatMoney, formatShortDate } from "@/lib/format";
import { printInvoice } from "@/lib/printInvoice";

const minorToTaka = (v) => (Number(v) || 0) / CURRENCY_MINOR_UNIT;
const takaToMinor = (v) => Math.round((Number(v) || 0) * CURRENCY_MINOR_UNIT);

function PaymentFormDialog({ open, invoice, onClose, onSubmit }) {
  const form = useForm({
    initialValues: { amount: "", method: "cash", note: "" },
    validate: (v) => {
      const e = {};
      if (!v.amount || Number(v.amount) <= 0) e.amount = "Enter an amount.";
      const due = minorToTaka(invoice?.amountDue || 0);
      if (due > 0 && Number(v.amount) > due) e.amount = "Amount exceeds balance due.";
      if (!v.method) e.method = "Choose a method.";
      return e;
    },
    onSubmit: async (values) => {
      await onSubmit({
        amount: takaToMinor(values.amount),
        method: values.method || "cash",
        note: values.note?.trim() || "",
      });
      onClose();
    },
  });

  useEffect(() => {
    if (!open || !invoice) return;
    const dueTaka = minorToTaka(invoice.amountDue || 0);
    form.reset({
      amount: dueTaka > 0 ? String(dueTaka) : "",
      method: "cash",
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id, invoice?.amountDue]);

  if (!open || !invoice) return null;

  return (
    <Dialog open={open} onClose={onClose} title={INVOICE_TEXT.RECORD_PAYMENT} className="max-w-md">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Due:{" "}
          <span className="font-medium text-foreground">
            {formatMoney(invoice.amountDue, CURRENCY)}
          </span>
        </p>
        <TextField label={`Amount (${CURRENCY})`} type="number" min={0} {...form.getFieldProps("amount")} />
        <SelectField
          label="Method"
          options={PAYMENT_METHOD_OPTIONS}
          {...form.getFieldProps("method")}
        />
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
            <dd className="text-right font-medium">
              <div>{invoice.patient?.name || invoice.patientName || "—"}</div>
              {(invoice.patientPhone || invoice.patient?.phone) && (
                <div className="text-xs font-normal text-muted-foreground">
                  {invoice.patientPhone || invoice.patient?.phone}
                </div>
              )}
              {(invoice.patientAddress || invoice.patient?.address) && (
                <div className="text-xs font-normal text-muted-foreground">
                  {invoice.patientAddress || invoice.patient?.address}
                </div>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Treatment</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {invoice.treatment ||
                (invoice.lineItems || []).map((l) => l.description).filter(Boolean).join(", ") ||
                "—"}
            </dd>
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
                    <span className="text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.method] || p.method}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.paidAt ? formatShortDate(p.paidAt) : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="secondary" onClick={() => printInvoice(invoice)}>
            <Printer className="size-4" />
            {INVOICE_TEXT.PRINT}
          </Button>
          {invoice.status !== "cancelled" && Number(invoice.amountDue) > 0 && (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onPayment?.(invoice);
              }}
            >
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
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(FILTER_ALL);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ type: null, invoice: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const state = useInvoices({ search, status, page });

  const statusOptions = [{ value: FILTER_ALL, label: "All statuses" }, ...INVOICE_STATUS_OPTIONS];

  const handlePayment = async (values) => {
    await state.addPayment(dialog.invoice.id, values);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await state.deleteInvoice(dialog.invoice.id);
      setDialog({ type: null, invoice: null });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{INVOICE_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{INVOICE_TEXT.LIST_DESC}</p>
        </div>
        <Link
          to={ROUTES.INVOICE_NEW}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" /> {INVOICE_TEXT.ADD}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${INPUT_CLASS} border-border pl-9`}
            placeholder="Search invoices…"
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
          options={statusOptions}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
      </div>

      {state.error && (
        <div className="mt-6">
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
        <div className="mt-6 space-y-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!state.error && !state.isLoading && state.invoices.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="No invoices yet"
            description="Create an invoice or register a patient to generate one."
            action={
              <Link
                to={ROUTES.INVOICE_NEW}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" /> {INVOICE_TEXT.ADD}
              </Link>
            }
          />
        </div>
      )}

      {!state.error && !state.isLoading && state.invoices.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.invoices.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-surface-muted/60"
                    onClick={() => setDialog({ type: INVOICE_DIALOGS.DETAILS, invoice: row })}
                  >
                    <td className="px-4 py-3 font-medium tabular-nums">{row.invoiceNumber}</td>
                    <td className="px-4 py-3">{row.patient?.name || row.patientName || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.totalCost, CURRENCY)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(row.amountDue, CURRENCY)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={INVOICE_STATUS_TONES[row.status] || "neutral"}>
                        {INVOICE_STATUS_LABELS[row.status] || row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {row.updatedAt ? formatShortDate(row.updatedAt) : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <IconButton label="Print" className="size-8" onClick={() => printInvoice(row)}>
                          <Printer className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Edit"
                          className="size-8"
                          onClick={() => navigate(ROUTES.INVOICE_EDIT.replace(":id", row.id))}
                        >
                          <PencilSimple className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Delete"
                          className="size-8"
                          onClick={() => setDialog({ type: INVOICE_DIALOGS.DELETE, invoice: row })}
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
          <div className="mt-4">
            <Pagination
              page={state.pagination.page}
              totalPages={state.pagination.pages}
              total={state.pagination.total}
              onPageChange={setPage}
              itemLabel="invoices"
            />
          </div>
        </>
      )}

      <InvoiceDetailsDialog
        open={dialog.type === INVOICE_DIALOGS.DETAILS}
        invoice={dialog.invoice}
        onClose={() => setDialog({ type: null, invoice: null })}
        onPayment={(inv) => setDialog({ type: INVOICE_DIALOGS.PAYMENT, invoice: inv })}
      />
      <PaymentFormDialog
        open={dialog.type === INVOICE_DIALOGS.PAYMENT}
        invoice={dialog.invoice}
        onClose={() => setDialog({ type: null, invoice: null })}
        onSubmit={handlePayment}
      />
      <ConfirmDialog
        open={dialog.type === INVOICE_DIALOGS.DELETE}
        onClose={() => setDialog({ type: null, invoice: null })}
        onConfirm={handleDelete}
        title="Delete invoice?"
        description="This cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
      <div className="sr-only" role="status">
        {INVOICE_MESSAGES.PAYMENT_ADDED}
      </div>
    </div>
  );
}
