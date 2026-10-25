import { useEffect, useState } from "react";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { API_ENDPOINTS } from "@/constants/api";
import {
  INVOICE_STAT_CARDS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
  INVOICE_STATUSES,
} from "@/constants/billing";
import { CURRENCY } from "@/constants/locale";
import { ROUTES } from "@/constants/routes";
import StatCard from "@/features/dashboard/StatCard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, formatShortDate } from "@/lib/format";

const BILLING_TEXT = Object.freeze({
  TITLE: "Billing",
  DESCRIPTION: "Treatment charges, payments and outstanding balances.",
  OUTSTANDING: "Outstanding balances",
  OUTSTANDING_HINT: "Patients with an unpaid balance, newest first.",
  VIEW_INVOICES: "View all invoices",
  EMPTY_TITLE: "No outstanding balances",
  EMPTY_DESCRIPTION: "All invoices are paid, or none have been created yet.",
  RETRY: "Try again",
});

export default function BillingPage() {
  usePageTitle(BILLING_TEXT.TITLE);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    setStatsLoading(true);
    setListLoading(true);
    setError(null);

    Promise.all([
      api(API_ENDPOINTS.INVOICES_STATS, { signal: c.signal }),
      api(API_ENDPOINTS.INVOICES, {
        params: { limit: 12, sort: "-updatedAt" },
        signal: c.signal,
      }),
    ])
      .then(([statsData, listData]) => {
        setStats(statsData);
        const all = listData.invoices || [];
        setRows(
          all.filter(
            (inv) =>
              inv.status === INVOICE_STATUSES.PENDING ||
              inv.status === INVOICE_STATUSES.OVERDUE ||
              (Number(inv.amountDue) || 0) > 0,
          ),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) {
          setStatsLoading(false);
          setListLoading(false);
        }
      });

    return () => c.abort();
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{BILLING_TEXT.TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{BILLING_TEXT.DESCRIPTION}</p>
        </div>
        <Link
          to={ROUTES.INVOICE}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {BILLING_TEXT.VIEW_INVOICES}
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INVOICE_STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.key}
            index={i + 1}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            isLoading={statsLoading}
            value={
              stats
                ? card.money
                  ? formatMoney(stats[card.key] ?? 0, CURRENCY)
                  : String(stats[card.key] ?? 0)
                : undefined
            }
          />
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{BILLING_TEXT.OUTSTANDING}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{BILLING_TEXT.OUTSTANDING_HINT}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <EmptyState
              icon={WarningCircle}
              title="Could not load billing"
              description={error.message}
              action={
                <Button variant="secondary" onClick={reload}>
                  {BILLING_TEXT.RETRY}
                </Button>
              }
            />
          </div>
        )}

        {!error && listLoading && (
          <div className="mt-4 space-y-2" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!error && !listLoading && rows.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={WarningCircle}
              title={BILLING_TEXT.EMPTY_TITLE}
              description={BILLING_TEXT.EMPTY_DESCRIPTION}
              action={
                <Link
                  to={ROUTES.INVOICE}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-muted"
                >
                  {BILLING_TEXT.VIEW_INVOICES}
                </Link>
              }
            />
          </div>
        )}

        {!error && !listLoading && rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Patient</th>
                  <th className="py-2 pr-3 font-medium">Due</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 pr-3 font-medium tabular-nums">{row.invoiceNumber}</td>
                    <td className="py-2.5 pr-3">{row.patient?.name || "—"}</td>
                    <td className="py-2.5 pr-3 tabular-nums font-medium">
                      {formatMoney(row.amountDue, CURRENCY)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={INVOICE_STATUS_TONES[row.status] || "neutral"}>
                        {INVOICE_STATUS_LABELS[row.status] || row.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground tabular-nums">
                      {row.updatedAt ? formatShortDate(row.updatedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
