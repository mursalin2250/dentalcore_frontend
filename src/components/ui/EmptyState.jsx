// `compact` is for small cards, where the default spacing would be too tall.
export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`grid place-items-center px-6 text-center ${compact ? "py-10" : "py-16"}`}>
      <span className="mb-4 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon size={24} />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
