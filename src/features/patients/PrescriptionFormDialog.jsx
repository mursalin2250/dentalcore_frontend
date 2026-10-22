import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormError from "@/components/ui/FormError";
import TextField from "@/components/ui/TextField";
import { PATIENT_MESSAGES, PATIENT_TEXT } from "@/constants/patients";

const INITIAL_FIELDS = 3;

export default function PrescriptionFormDialog({ open, onSubmit, onClose }) {
  const [medicines, setMedicines] = useState(() => Array(INITIAL_FIELDS).fill(""));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setMedicine = (index, value) => {
    setMedicines((current) => current.map((item, i) => (i === index ? value : item)));
    setError("");
  };

  const addField = () => setMedicines((current) => [...current, ""]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleaned = medicines.map((m) => m.trim()).filter(Boolean);
    if (!medicines[0].trim()) {
      setError(PATIENT_MESSAGES.MEDICINE_REQUIRED);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ medicines: cleaned });
      setMedicines(Array(INITIAL_FIELDS).fill(""));
      setError("");
    } catch (err) {
      setError(err.message || PATIENT_MESSAGES.MEDICINE_REQUIRED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMedicines(Array(INITIAL_FIELDS).fill(""));
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={PATIENT_TEXT.ADD_PRESCRIPTION}
      description="List the medicines for this prescription."
      className="max-w-md"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-3">
        {medicines.map((value, index) => (
          <TextField
            key={index}
            label={`${PATIENT_TEXT.MEDICINE} ${index + 1}`}
            autoComplete="off"
            value={value}
            onChange={(e) => setMedicine(index, e.target.value)}
            error={index === 0 && error ? error : undefined}
          />
        ))}

        <Button type="button" variant="secondary" className="w-full" onClick={addField}>
          <Plus /> {PATIENT_TEXT.ADD_MEDICINE_FIELD}
        </Button>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {PATIENT_TEXT.ADD_PRESCRIPTION}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
