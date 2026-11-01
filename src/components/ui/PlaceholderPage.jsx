export default function PlaceholderPage({ title, description }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description || "This page is not built yet."}
        </p>
      </div>
    </div>
  );
}
