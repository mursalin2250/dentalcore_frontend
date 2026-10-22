import { MIN_PASSWORD_LENGTH } from "./validation";

export const AUTH_MESSAGES = Object.freeze({
  PASSWORD_REQUIRED: "Enter your password.",
  PASSWORD_TOO_SHORT: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  CONFIRM_REQUIRED: "Confirm your password.",
  PASSWORDS_MISMATCH: "Passwords do not match.",
  MISSING_PROVIDER: "useAuth must be used inside <AuthProvider>.",
});
