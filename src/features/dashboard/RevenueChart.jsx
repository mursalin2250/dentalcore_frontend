import { useMemo, useState } from "react";
import { Coins } from "@phosphor-icons/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Skeleton from "@/components/ui/Skeleton";
import { API_ENDPOINTS } from "@/constants/api";
import {
  BUCKET_UNITS,
  CHART_ANIMATION_MS,
  CHART_HEIGHT,
  DASHBOARD_RANGE_OPTIONS,
  DASHBOARD_TEXT,
  DEFAULT_DASHBOARD_RANGE,
  WIDGET_INDEX,
} from "@/constants/dashboard";
import { CURRENCY_MINOR_UNIT } from "@/constants/locale";
import { useApiData } from "@/hooks/useApiData";
import { formatBucket, formatCompact, formatMoney } from "@/lib/format";
import DateRangeSelect from "./DateRangeSelect";
import WidgetCard from "./WidgetCard";

const T = DASHBOARD_TEXT.REVENUE;
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const Y_AXIS_WIDTH = 44;

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-popover">
      <p className="text-muted-foreground">{point.label}</p>
      <p className="font-medium tabular-nums">{formatMoney(point.amount, currency)}</p>
    </div>
  );
}

export default function RevenueChart() {
  const [range, setRange] = useState(DEFAULT_DASHBOARD_RANGE);
  const state = useApiData(API_ENDPOINTS.DASHBOARD_REVENUE, { range });
  const rangeLabel = DASHBOARD_RANGE_OPTIONS.find((option) => option.value === range).label;

  // Skip the draw-in animation for people who ask for less motion.
  const animate = useMemo(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  return (
    <WidgetCard
      title={T.title}
      description={T.description}
      state={state}
      index={WIDGET_INDEX.REVENUE}
      isEmpty={state.data?.total === 0}
      empty={{ icon: Coins, title: T.emptyTitle, description: T.emptyDescription }}
      skeleton={<Skeleton className="mx-5 mb-5 min-h-[20.5rem] flex-1" />}
      className="xl:col-span-2"
      wrapHeader
      action={
        <DateRangeSelect label={T.rangeLabel} options={DASHBOARD_RANGE_OPTIONS} value={range} onChange={setRange} />
      }
    >
      {({ series, total, currency, unit }) => {
        const isMonthly = unit === BUCKET_UNITS.MONTH;
        const points = series.map((point) => ({ ...point, label: formatBucket(point.date, isMonthly) }));
        const totalText = formatMoney(total, currency);

        return (
          <figure className="flex min-h-0 flex-1 flex-col px-5 pb-5">
            <p className="text-sm text-muted-foreground">{T.total}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{totalText}</p>

            {/* Text alternative: the drawing is hidden from screen readers, the table carries the same data. */}
            <figcaption className="sr-only">{T.chartSummary(totalText, rangeLabel)}</figcaption>
            <table className="sr-only">
              <caption>{T.title}</caption>
              <thead>
                <tr><th scope="col">Date</th><th scope="col">Amount</th></tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.date}>
                    <th scope="row">{point.label}</th>
                    <td>{formatMoney(point.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Grows to fill remaining card height so the pair stays equal without a blank band under the chart.
                min-height keeps the chart at least its designed size on narrow layouts. */}
            <div aria-hidden="true" className="mt-4 flex-1" style={{ minHeight: CHART_HEIGHT }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis
                    width={Y_AXIS_WIDTH}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompact(value / CURRENCY_MINOR_UNIT)}
                  />
                  <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: "var(--border)" }} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="var(--primary)"
                    fillOpacity={0.1}
                    isAnimationActive={animate}
                    animationDuration={CHART_ANIMATION_MS}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </figure>
        );
      }}
    </WidgetCard>
  );
}
