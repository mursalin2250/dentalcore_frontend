import { useEffect } from "react";

// Calls onDismiss on Escape and, if `ref` is given, on a pointer press outside it.
// `restoreFocus` is true for Escape so the caller can return focus to its trigger.
export function useDismiss({ open, ref, onDismiss }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onDismiss({ restoreFocus: true });
    };
    const onPointerDown = (e) => {
      if (ref?.current && !ref.current.contains(e.target)) {
        onDismiss({ restoreFocus: false });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, ref, onDismiss]);
}
