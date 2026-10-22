import { useEffect, useId, useRef } from "react";

// Modal built on the native <dialog>: focus trap, Escape, inert background and
// focus restore come from the browser. Children mount only while open, so
// forms inside start fresh every time.
export default function Dialog({ open, onClose, title, description, children, className = "" }) {
  const ref = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const el = ref.current;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      // Close on backdrop click, but not when a text selection drag ends there.
      onMouseDown={(e) => (pressStartedOnBackdrop.current = e.target === ref.current)}
      onClick={(e) => {
        if (pressStartedOnBackdrop.current && e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-popover transition-[opacity,transform] duration-200 ease-out-strong backdrop:bg-foreground/40 open:starting:scale-95 open:starting:opacity-0 motion-reduce:transition-none ${className || "max-w-md"}`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
