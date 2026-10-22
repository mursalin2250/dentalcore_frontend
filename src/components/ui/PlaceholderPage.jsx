// Temporary page body. Replace per feature as each module is built.
export default function PlaceholderPage({ title, description }) {
  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-8 grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-surface text-sm text-muted-foreground">
        This page is not built yet.
      </div>
    </div>
  );
}
