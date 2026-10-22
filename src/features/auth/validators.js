import { AUTH_MESSAGES } from "@/constants/auth";
import { MIN_PASSWORD_LENGTH } from "@/constants/validation";
import { omitEmpty, validateEmail, validateName } from "@/lib/validation";

export function validateLogin({ email, password }) {
  return omitEmpty({
    email: validateEmail(email),
    password: password ? undefined : AUTH_MESSAGES.PASSWORD_REQUIRED,
  });
}

export function validateSignup({ name, email, password, confirmPassword }) {
  let passwordError;
  if (!password) passwordError = AUTH_MESSAGES.PASSWORD_REQUIRED;
  else if (password.length < MIN_PASSWORD_LENGTH) passwordError = AUTH_MESSAGES.PASSWORD_TOO_SHORT;

  let confirmError;
  if (!confirmPassword) confirmError = AUTH_MESSAGES.CONFIRM_REQUIRED;
  else if (confirmPassword !== password) confirmError = AUTH_MESSAGES.PASSWORDS_MISMATCH;

  return omitEmpty({
    name: validateName(name),
    email: validateEmail(email),
    password: passwordError,
    confirmPassword: confirmError,
  });
}
