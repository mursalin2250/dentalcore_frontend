import Button from "./Button";
import Dialog from "./Dialog";
import FormError from "./FormError";

// Cancel comes first in the DOM, so it receives focus: the safe default.
export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, loading = false, error = "" }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      {error && <FormError className="mb-4">{error}</FormError>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
