import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus, WarningCircle } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS } from "@/constants/api";
import {
  FILTER_ALL,
  MOVEMENT_DIALOGS,
  MOVEMENT_MESSAGES,
  MOVEMENT_STAT_CARDS,
  MOVEMENT_TEXT,
  SEARCH_DEBOUNCE_MS,
  STOCK_MOVEMENT_LABELS,
  STOCK_MOVEMENT_TONES,
  STOCK_MOVEMENT_TYPE_OPTIONS,
  STOCK_MOVEMENT_TYPES,
} from "@/constants/inventory";
import StatCard from "@/features/dashboard/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { CURRENCY } from "@/constants/locale";
import { formatMoney, formatNumber, formatShortDate, formatTime } from "@/lib/format";
import MovementFormDialog from "./MovementFormDialog";
import { useStockMovements } from "./useStockMovements";

export default function StockMovementPage() {
  usePageTitle(MOVEMENT_TEXT.LIST_TITLE);
  const [query, setQuery] = useState("");
  const [type, setType] = useState(FILTER_ALL);
  const [medication, setMedication] = useState(FILTER_ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ type: null });
  const [announcement, setAnnouncement] = useState("");
  const [medOptions, setMedOptions] = useState([{ value: FILTER_ALL, label: "All medications" }]);

  const search = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
  const state = useStockMovements({
    search,
    type,
    medication,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    page,
  });

  useEffect(() => {
    const c = new AbortController();
    api(API_ENDPOINTS.MEDICATIONS, { params: { limit: 50, sort: "name" }, signal: c.signal })
      .then((data) => {
        setMedOptions([
          { value: FILTER_ALL, label: "All medications" },
          ...(data.medications || []).map((m) => ({ value: m.id, label: m.name })),
        ]);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  const typeOptions = [{ value: FILTER_ALL, label: "All types" }, ...STOCK_MOVEMENT_TYPE_OPTIONS];

  const handleCreate = async (values) => {
    await state.createMovement(values);
    setAnnouncement(MOVEMENT_MESSAGES.CREATED);
  };

  const qtyLabel = (row) => {
    const sign =
      row.type === STOCK_MOVEMENT_TYPES.IN ? "+" : row.type === STOCK_MOVEMENT_TYPES.OUT ? "−" : "±";
    return `${sign}${formatNumber(row.quantity)}`;
  };

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{MOVEMENT_TEXT.LIST_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{MOVEMENT_TEXT.LIST_DESCRIPTION}</p>
        </div>
        <Button onClick={() => setDialog({ type: MOVEMENT_DIALOGS.ADD })}>
          <Plus /> {MOVEMENT_TEXT.ADD}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOVEMENT_STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            index={i + 1}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            isLoading={state.statsLoading}
            value={state.stats ? formatNumber(state.stats[card.key] ?? 0) : undefined}
          />
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[12rem] flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label={MOVEMENT_TEXT.SEARCH_PLACEHOLDER}
              placeholder={MOVEMENT_TEXT.SEARCH_PLACEHOLDER}
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
            options={typeOptions}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
          <SelectField
            label=""
            hideLabel
            options={medOptions}
            value={medication}
            onChange={(e) => {
              setMedication(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
          />
          <DateField
            label="From"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
          <DateField
            label="To"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
        </div>

        {state.error && (
          <div className="mt-4">
            <EmptyState
              icon={WarningCircle}
              title="Could not load movements"
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
        {!state.error && !state.isLoading && state.movements.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={WarningCircle}
              title={search || type !== FILTER_ALL ? MOVEMENT_TEXT.EMPTY_FILTER_TITLE : MOVEMENT_TEXT.EMPTY_TITLE}
              description={
                search || type !== FILTER_ALL
                  ? MOVEMENT_TEXT.EMPTY_FILTER_DESCRIPTION
                  : MOVEMENT_TEXT.EMPTY_DESCRIPTION
              }
            />
          </div>
        )}
        {!state.error && !state.isLoading && state.movements.length > 0 && (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Medication</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Qty</th>
                    <th className="py-2 pr-3 font-medium">Stock</th>
                    <th className="py-2 pr-3 font-medium">Total cost</th>
                    <th className="py-2 pr-3 font-medium">Reason</th>
                    <th className="py-2 font-medium">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.movements.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2.5 pr-3 tabular-nums">
                        <span className="block">{formatShortDate(row.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(row.createdAt)}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{row.medication?.name || "—"}</p>
                        {row.medication?.sku && (
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{row.medication.sku}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={STOCK_MOVEMENT_TONES[row.type] || "neutral"}>
                          {STOCK_MOVEMENT_LABELS[row.type] || row.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums font-medium">{qtyLabel(row)}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                        {formatNumber(row.stockBefore)} → {formatNumber(row.stockAfter)}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMoney(row.totalCost || 0, CURRENCY)}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{row.reason}</td>
                      <td className="py-2.5 text-muted-foreground">{row.performedBy?.name || "—"}</td>
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
              itemLabel="movements"
            />
          </>
        )}
      </section>

      <MovementFormDialog
        open={dialog.type === MOVEMENT_DIALOGS.ADD}
        onSubmit={handleCreate}
        onClose={() => setDialog({ type: null })}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
