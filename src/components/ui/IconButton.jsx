// Square icon-only button. `label` becomes the accessible name.
export default function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-muted-foreground shadow-card transition-[color,background-color,transform] duration-150 ease-out hover:bg-surface-muted hover:text-foreground active:scale-[0.97] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
