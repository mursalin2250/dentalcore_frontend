import { useState } from "react";
import { MagnifyingGlass, PencilSimple, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import { INPUT_CLASS } from "@/components/ui/TextField";
import {
  EXPIRY_FILTER_OPTIONS,
  EXPIRY_FLAG_LABELS,
  EXPIRY_FLAG_TONES,
  FILTER_ALL,
  MEDICATION_CATEGORY_OPTIONS,
  MEDICATION_DIALOGS,
  MEDICATION_ITEM_TYPE_OPTIONS,
  MEDICATION_MESSAGES,
  MEDICATION_STAT_CARDS,
  MEDICATION_TEXT,
  SEARCH_DEBOUNCE_MS,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_OPTIONS,
  STOCK_STATUS_TONES,
} from "@/constants/inventory";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatMoney, formatNumber, formatShortDate } from "@/lib/format";
import { CURRENCY } from "@/constants/locale";
import MedicationFormDialog from "./MedicationFormDialog";
import { useMedications } from "./useMedications";

export default function MedicationsPage() {
  usePageTitle(MEDICATION_TEXT.LIST_TITLE);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(FILTER_ALL);
  const [itemType, setItemType] = useState(FILTER_ALL);
  const [status, setStatus] = useState(FILTER_ALL);
  const [expiry, setExpiry] = useState(FILTER_ALL);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ type: null, medication: null });
  const [announcement, setAnnouncement] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const state = useMedications({ search, category, itemType, status, expiry, page });

  const categoryOptions = [{ value: FILTER_ALL, label: "All categories" }, ...MEDICATION_CATEGORY_OPTIONS];
  const typeOptions = [{ value: FILTER_ALL, label: "All types" }, ...MEDICATION_ITEM_TYPE_OPTIONS];
  const statusOptions = [{ value: FILTER_ALL, label: "All statuses" }, ...STOCK_STATUS_OPTIONS];
  const expiryOptions = [{ value: FILTER_ALL, label: "All expiry" }, ...EXPIRY_FILTER_OPTIONS];

  const handleCreate = async (values) => {
    await state.createMedication(values);
    setAnnouncement(MEDICATION_MESSAGES.CREATED);
  };
  const handleEdit = async (values) => {
    await state.updateMedication(dialog.medication.id, values);
    setAnnouncement(MEDICATION_MESSAGES.UPDATED);
  };
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const r = await state.removeMedication(dialog.medication.id);
      setAnnouncement(r?.archived ? MEDICATION_MESSAGES.ARCHIVED : MEDICATION_MESSAGES.DELETED);
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
          <h1 className="text-2xl font-semibold tracking-tight">{MEDICATION_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{MEDICATION_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <Button onClick={() => setDialog({ type: MEDICATION_DIALOGS.ADD })}>
          <Plus /> {MEDICATION_TEXT.ADD}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MEDICATION_STAT_CARDS.map((card, i) => (
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
              aria-label={MEDICATION_TEXT.SEARCH_PLACEHOLDER}
              placeholder={MEDICATION_TEXT.SEARCH_PLACEHOLDER}
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
            options={categoryOptions}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
          <SelectField
            label=""
            hideLabel
            options={typeOptions}
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-36"
          />
          <SelectField
            label=""
            hideLabel
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-36"
          />
          <SelectField
            label=""
            hideLabel
            options={expiryOptions}
            value={expiry}
            onChange={(e) => {
              setExpiry(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
        </div>

        {state.error && (
          <div className="mt-4">
            <EmptyState
              icon={WarningCircle}
              title="Could not load medications"
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
        {!state.error && !state.isLoading && state.medications.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={WarningCircle}
              title={search || category !== FILTER_ALL ? MEDICATION_TEXT.EMPTY_FILTER_TITLE : MEDICATION_TEXT.EMPTY_TITLE}
              description={
                search || category !== FILTER_ALL
                  ? MEDICATION_TEXT.EMPTY_FILTER_DESCRIPTION
                  : MEDICATION_TEXT.EMPTY_DESCRIPTION
              }
            />
          </div>
        )}
        {!state.error && !state.isLoading && state.medications.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Stock</th>
                    <th className="py-2 pr-3 font-medium">Unit price</th>
                    <th className="py-2 pr-3 font-medium">Total price</th>
                    <th className="py-2 pr-3 font-medium">Expiry</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.medications.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{row.name}</p>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{row.sku}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.category}</td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {formatNumber(row.stock)} {row.unit}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.unitPrice, CURRENCY)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.totalCost, CURRENCY)}</td>
                      <td className="py-2.5 pr-3">
                        {row.expiryDate ? (
                          <span className="inline-flex flex-col gap-1">
                            <span className="tabular-nums">{formatShortDate(row.expiryDate)}</span>
                            {row.expiryFlag !== "ok" && row.expiryFlag !== "none" && (
                              <Badge tone={EXPIRY_FLAG_TONES[row.expiryFlag] || "neutral"}>
                                {EXPIRY_FLAG_LABELS[row.expiryFlag]}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={STOCK_STATUS_TONES[row.status] || "neutral"}>
                          {STOCK_STATUS_LABELS[row.status] || row.status}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1">
                          <IconButton
                            label="Edit"
                            className="size-8"
                            onClick={() => setDialog({ type: MEDICATION_DIALOGS.EDIT, medication: row })}
                          >
                            <PencilSimple className="size-4" />
                          </IconButton>
                          <IconButton
                            label="Delete"
                            className="size-8"
                            onClick={() => {
                              setDeleteError("");
                              setDialog({ type: MEDICATION_DIALOGS.DELETE, medication: row });
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
              itemLabel="items"
            />
          </>
        )}
      </section>

      <MedicationFormDialog
        open={dialog.type === MEDICATION_DIALOGS.ADD}
        onSubmit={handleCreate}
        onClose={() => setDialog({ type: null })}
      />
      <MedicationFormDialog
        open={dialog.type === MEDICATION_DIALOGS.EDIT}
        medication={dialog.medication}
        onSubmit={handleEdit}
        onClose={() => setDialog({ type: null })}
      />
      <ConfirmDialog
        open={dialog.type === MEDICATION_DIALOGS.DELETE}
        onClose={() => setDialog({ type: null })}
        onConfirm={handleDelete}
        title={MEDICATION_TEXT.DELETE}
        description={MEDICATION_MESSAGES.DELETE_DESCRIPTION}
        confirmLabel={MEDICATION_TEXT.DELETE}
        loading={deleteLoading}
        error={deleteError}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
