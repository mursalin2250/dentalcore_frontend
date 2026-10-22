import { CircleNotch } from "@phosphor-icons/react";

const BASE =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-muted",
  danger: "bg-danger-solid text-white hover:bg-danger-solid/90",
};

// Also used to style <Link> as a button.
export function getButtonClasses(variant = "primary") {
  return `${BASE} ${VARIANTS[variant]}`;
}

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${getButtonClasses(variant)} ${className}`}
      {...props}
    >
      {loading && <CircleNotch className="animate-spin" />}
      {children}
    </button>
  );
}
