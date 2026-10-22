const DOT_TONES = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
  info: "bg-info",
};

// Status pill. The dot carries the colour; the text stays high-contrast.
export default function Badge({ tone = "neutral", children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${DOT_TONES[tone]}`} />
      {children}
    </span>
  );
}
