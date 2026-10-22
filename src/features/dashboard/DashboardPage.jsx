import { WarningCircle } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { API_ENDPOINTS } from "@/constants/api";
import {
  DASHBOARD_TEXT,
  GREETING_HOURS,
  GREETINGS,
  REVENUE_ROLES,
  STAT_CARDS,
} from "@/constants/dashboard";
import { useAuth } from "@/features/auth/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { formatAmount, formatLongDate, formatNumber, getClinicHour } from "@/lib/format";
import LowStockList from "./LowStockList";
import RecentActivity from "./RecentActivity";
import RevenueChart from "./RevenueChart";
import StatCard from "./StatCard";
import UpcomingAppointments from "./UpcomingAppointments";

function getGreeting(date) {
  const hour = getClinicHour(date);
  if (hour >= GREETING_HOURS.EVENING_FROM) return GREETINGS.EVENING;
  if (hour >= GREETING_HOURS.AFTERNOON_FROM) return GREETINGS.AFTERNOON;
  return GREETINGS.MORNING;
}

function StatCards({ state }) {
  const { data, error, isLoading, reload } = state;

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-surface shadow-card sm:col-span-2 xl:col-span-4">
        <EmptyState
          compact
          icon={WarningCircle}
          title={DASHBOARD_TEXT.ERROR_TITLE}
          description={error.message}
          action={<Button variant="secondary" onClick={reload}>{DASHBOARD_TEXT.RETRY}</Button>}
        />
      </div>
    );
  }

  // While loading we do not know the role's cards yet, so show the full set of placeholders.
  const cards = data ? STAT_CARDS.filter((card) => data.cards[card.key]) : STAT_CARDS;
  return cards.map((card, i) => {
    const stat = data?.cards[card.key];
    return (
      <StatCard
        key={card.key}
        index={i + 1}
        label={card.label}
        icon={card.icon}
        tone={card.tone}
        isLoading={!data}
        subtitle={card.format === "money" && data ? `(${data.currency})` : undefined}
        value={stat && (card.format === "money" ? formatAmount(stat.value) : formatNumber(stat.value))}
      />
    );
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useApiData(API_ENDPOINTS.DASHBOARD_SUMMARY);
  const now = new Date();
  const firstName = user.name.split(" ")[0];
  const canSeeRevenue = REVENUE_ROLES.includes(user.role);

  return (
    <div className="py-4">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting(now)}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatLongDate(now)}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCards state={summary} />
      </div>

      {/* Dense flow: without the revenue chart, the other widgets slide up to fill the row. */}
      <div className="mt-4 grid gap-4 xl:grid-flow-dense xl:grid-cols-3">
        {canSeeRevenue && <RevenueChart />}
        <LowStockList />
        <UpcomingAppointments />
        <RecentActivity />
      </div>
    </div>
  );
}
