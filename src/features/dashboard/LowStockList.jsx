import { Pill } from "@phosphor-icons/react";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { API_ENDPOINTS } from "@/constants/api";
import {
  BREAKPOINT_QUERIES,
  DASHBOARD_LINKS,
  DASHBOARD_TEXT,
  LIST_LIMITS,
  LOW_STOCK_NARROW_LIMIT,
  LOW_STOCK_ROW_PX,
  LOW_STOCK_SKELETON_ROWS,
  WIDGET_INDEX,
} from "@/constants/dashboard";
import { useApiData } from "@/hooks/useApiData";
import { useFitCount } from "@/hooks/useFitCount";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatNumber } from "@/lib/format";
import ViewDetailsLink from "./ViewDetailsLink";
import WidgetCard from "./WidgetCard";

const T = DASHBOARD_TEXT.LOW_STOCK;
const PARAMS = { limit: LIST_LIMITS.LOW_STOCK };

// Rows have a fixed height (h-16) so the number that fits is exact.
function Rows({ items }) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {items.map((item) => {
        const percent = item.reorderLevel > 0 ? Math.min(100, (item.quantity / item.reorderLevel) * 100) : 0;
        return (
          <li key={item.id} className="flex h-16 flex-col justify-center px-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium">{item.name}</p>
              <p className="shrink-0 text-sm tabular-nums">{T.left(formatNumber(item.quantity), item.unit)}</p>
            </div>
            {/* Decorative bar: the numbers beside it say the same thing. */}
            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full origin-left animate-grow rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Wide layout: the card is as tall as the revenue chart beside it, so show as many rows as fit.
// Narrow layout: no height to fill, so show a short list.
function FitList({ items }) {
  const isWide = useMediaQuery(BREAKPOINT_QUERIES.XL);
  const [measureRef, fitCount] = useFitCount(LOW_STOCK_ROW_PX);

  if (!isWide) return <Rows items={items.slice(0, LOW_STOCK_NARROW_LIMIT)} />;

  const visible = fitCount === null ? items : items.slice(0, Math.max(1, fitCount));
  return (
    <div ref={measureRef} className="absolute inset-0 overflow-hidden">
      <Rows items={visible} />
    </div>
  );
}

export default function LowStockList() {
  const state = useApiData(API_ENDPOINTS.DASHBOARD_LOW_STOCK, PARAMS);

  return (
    <WidgetCard
      title={T.title}
      description={T.description}
      state={state}
      index={WIDGET_INDEX.LOW_STOCK}
      fill
      isEmpty={state.data?.items.length === 0}
      empty={{ icon: Pill, title: T.emptyTitle, description: T.emptyDescription }}
      skeleton={<SkeletonRows count={LOW_STOCK_SKELETON_ROWS} />}
      action={<ViewDetailsLink to={DASHBOARD_LINKS.LOW_STOCK} label="View all medications" />}
    >
      {({ items }) => <FitList items={items} />}
    </WidgetCard>
  );
}
