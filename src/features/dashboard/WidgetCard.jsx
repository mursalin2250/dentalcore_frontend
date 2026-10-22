import { useId } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { DASHBOARD_TEXT, STAGGER_MS } from "@/constants/dashboard";

// Card shell that owns the loading / error / empty states for one widget.
// `children` is a function that receives the loaded data, so it never runs without data.
export default function WidgetCard({
  title,
  description,
  action,
  state,
  isEmpty = false,
  empty,
  skeleton,
  className = "",
  index = 0,
  wrapHeader = false,
  fill = false,
  children,
}) {
  const titleId = useId();
  const { data, error, isLoading, reload } = state;

  let body;
  if (error) {
    body = (
      <EmptyState
        compact
        icon={WarningCircle}
        title={DASHBOARD_TEXT.ERROR_TITLE}
        description={error.message}
        action={<Button variant="secondary" onClick={reload}>{DASHBOARD_TEXT.RETRY}</Button>}
      />
    );
  } else if (!data) {
    body = (
      <div role="status" className="flex min-h-0 flex-1 flex-col">
        <span className="sr-only">Loading {title}</span>
        {skeleton}
      </div>
    );
  } else if (isEmpty) {
    body = <EmptyState compact {...empty} />;
  } else {
    // Dim (not replace) the content while a refetch runs.
    // flex-1 lets content (e.g. the revenue chart) grow when the card is stretched by the grid,
    // eliminating blank space under fixed-height children while keeping outer card heights equal.
    body = (
      <div
        className={`flex min-h-0 flex-1 flex-col animate-fade transition-opacity duration-150 ease-out ${
          fill ? "relative xl:min-h-[20.5rem]" : ""
        } ${isLoading ? "opacity-60" : ""}`}
      >
        {children(data)}
      </div>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={isLoading}
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
      className={`flex min-w-0 animate-rise flex-col rounded-xl border border-border bg-surface shadow-card ${className}`}
    >
      <header className={`flex items-center justify-between gap-x-4 gap-y-3 px-5 pt-5 ${wrapHeader ? "flex-wrap" : ""}`}>
        <div className={`flex-1 ${wrapHeader ? "min-w-32" : "min-w-0"}`}>
          <h2 id={titleId} className="text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">{body}</div>
    </section>
  );
}
