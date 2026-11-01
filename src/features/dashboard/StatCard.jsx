import Skeleton from "@/components/ui/Skeleton";
import { STAGGER_MS } from "@/constants/dashboard";

const TONES = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  danger: "bg-danger/10 text-danger",
};

export default function StatCard({ label, subtitle, value, icon: Icon, tone = "primary", isLoading, index = 0 }) {
  return (
    <div
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
      className="animate-rise rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <p>{label}</p>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
          <Icon />
        </span>
      </div>
      {isLoading ? (
        <div role="status">
          <span className="sr-only">Loading {label}</span>
          <Skeleton className="mt-3 h-9 w-28" />
        </div>
      ) : (
        // Wraps instead of clipping, so the full amount is always readable.
        <p className="mt-3 animate-fade break-all text-2xl font-semibold leading-tight tracking-tight tabular-nums sm:text-3xl">
          {value}
        </p>
      )}
    </div>
  );
}
