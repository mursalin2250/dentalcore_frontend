import { AUTH_MESSAGES } from "@/constants/auth";
import { TEAM_MESSAGES } from "@/constants/team";
import { MIN_PASSWORD_LENGTH } from "@/constants/validation";
import { omitEmpty, validateEmail, validateName } from "@/lib/validation";

// Quick checks before calling the API. The server re-checks everything (and the unique email).
export function validateNewMember({ name, email, password }) {
  let passwordError;
  if (!password) passwordError = TEAM_MESSAGES.TEMP_PASSWORD_REQUIRED;
  else if (password.length < MIN_PASSWORD_LENGTH) passwordError = AUTH_MESSAGES.PASSWORD_TOO_SHORT;

  return omitEmpty({
    name: validateName(name),
    email: validateEmail(email),
    password: passwordError,
  });
}
