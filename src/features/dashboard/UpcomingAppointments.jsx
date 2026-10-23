import { useState } from "react";
import { CalendarCheck } from "@phosphor-icons/react";
import Badge from "@/components/ui/Badge";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { APPOINTMENT_STATUS_META } from "@/constants/appointments";
import { API_ENDPOINTS } from "@/constants/api";
import { DASHBOARD_LINKS, DASHBOARD_TEXT, LIST_LIMITS, WIDGET_INDEX } from "@/constants/dashboard";
import { useApiData } from "@/hooks/useApiData";
import { formatShortDate, formatTime, isSameClinicDay } from "@/lib/format";
import AppointmentDetailsDialog from "@/features/appointments/AppointmentDetailsDialog";
import ViewDetailsLink from "./ViewDetailsLink";
import WidgetCard from "./WidgetCard";

const T = DASHBOARD_TEXT.APPOINTMENTS;
const PARAMS = { limit: LIST_LIMITS.APPOINTMENTS };

export default function UpcomingAppointments() {
  const state = useApiData(API_ENDPOINTS.DASHBOARD_UPCOMING_APPOINTMENTS, PARAMS);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
    <WidgetCard
      title={T.title}
      description={T.description}
      state={state}
      index={WIDGET_INDEX.APPOINTMENTS}
      isEmpty={state.data?.items.length === 0}
      empty={{ icon: CalendarCheck, title: T.emptyTitle, description: T.emptyDescription }}
      skeleton={<SkeletonRows count={LIST_LIMITS.APPOINTMENTS} />}
      className="xl:col-span-2"
      action={<ViewDetailsLink to={DASHBOARD_LINKS.APPOINTMENTS} label="View all appointments" />}
    >
      {({ items }) => (
        <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border border-t border-border">
          {items.map((item) => {
            const status = APPOINTMENT_STATUS_META[item.status];
            const details = [item.doctor && T.withDoctor(item.doctor), item.treatment]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={item.id} className="min-h-[4.25rem] flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="flex h-full w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/20"
                >
                  <time
                    dateTime={item.startsAt}
                    className="w-20 shrink-0 text-sm font-medium tabular-nums"
                  >
                    {formatTime(item.startsAt)}
                    {!isSameClinicDay(item.startsAt, Date.now()) && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {formatShortDate(item.startsAt)}
                      </span>
                    )}
                  </time>
                  <div className="min-w-32 flex-1">
                    <p className="truncate text-sm font-medium">{item.patient}</p>
                    <p className="truncate text-sm text-muted-foreground">{details}</p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
      <AppointmentDetailsDialog
        open={Boolean(selectedId)}
        appointmentId={selectedId}
        onClose={() => setSelectedId(null)}
        showActions={false}
      />
    </>
  );
}
