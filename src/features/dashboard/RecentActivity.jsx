import { Pulse } from "@phosphor-icons/react";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { API_ENDPOINTS } from "@/constants/api";
import { ACTIVITY_META, DASHBOARD_TEXT, LIST_LIMITS, WIDGET_INDEX } from "@/constants/dashboard";
import { useApiData } from "@/hooks/useApiData";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import WidgetCard from "./WidgetCard";

const T = DASHBOARD_TEXT.ACTIVITY;
const PARAMS = { limit: LIST_LIMITS.ACTIVITY };

export default function RecentActivity() {
  const state = useApiData(API_ENDPOINTS.DASHBOARD_ACTIVITY, PARAMS);

  return (
    <WidgetCard
      title={T.title}
      description={T.description}
      state={state}
      index={WIDGET_INDEX.ACTIVITY}
      isEmpty={state.data?.items.length === 0}
      empty={{ icon: Pulse, title: T.emptyTitle, description: T.emptyDescription }}
      skeleton={<SkeletonRows count={LIST_LIMITS.ACTIVITY} />}
    >
      {({ items, currency }) => (
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border border-t border-border">
          {items.map((item) => {
            const meta = ACTIVITY_META[item.type];
            const Icon = meta.icon;
            const actionText = meta.action(item, {
              formatMoney: (amount) => formatMoney(amount, currency),
            });
            return (
              <li
                key={item.id}
                className="flex min-h-[4.25rem] flex-1 items-center gap-3 px-5 py-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.subject}</p>
                  {actionText && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{actionText}</p>
                  )}
                </div>
                <time dateTime={item.at} className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
