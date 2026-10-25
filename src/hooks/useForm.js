import { useState } from "react";

// Small form helper: values, inline errors, and a submit handler that
// validates first, then shows server errors from `onSubmit` (ApiError).
export function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(""); // errors not tied to a field
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = (next = initialValues) => {
    setValues(next);
    setErrors({});
    setFormError("");
  };

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  // Spread onto TextField / SelectField.
  const getFieldProps = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (event) => setValue(name, event.target.value),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError("");

    const found = validate(values);
    setErrors(found);
    const [firstInvalid] = Object.keys(found);
    if (firstInvalid) {
      form.elements[firstInvalid]?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // Field errors go under their inputs; anything else becomes a form-level message.
      const fieldErrors = error.fieldErrors ?? {};
      const shown = Object.keys(fieldErrors).filter((name) => form.elements?.[name]);
      setErrors(fieldErrors);
      if (shown.length > 0) {
        form.elements[shown[0]]?.focus?.();
      } else {
        const detail = Object.values(fieldErrors).filter(Boolean).join(" ");
        setFormError(detail || error.message || "Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, errors, formError, isSubmitting, setValue, reset, getFieldProps, handleSubmit };
}
