import { EMAIL_PATTERN, VALIDATION_MESSAGES } from "@/constants/validation";

// Each validator returns an error message, or undefined when the value is fine.
export function validateName(name) {
  return name.trim() ? undefined : VALIDATION_MESSAGES.NAME_REQUIRED;
}

export function validateEmail(email) {
  if (!email.trim()) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
  return EMAIL_PATTERN.test(email.trim()) ? undefined : VALIDATION_MESSAGES.EMAIL_INVALID;
}

// Drops fields that passed, so an empty object means "valid".
export function omitEmpty(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
