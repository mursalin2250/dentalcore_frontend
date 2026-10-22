import { DOCTOR_MESSAGES } from "@/constants/doctors";
import { omitEmpty } from "@/lib/validation";

export function validateDoctor({ name }) {
  return omitEmpty({
    name: name?.trim() ? undefined : DOCTOR_MESSAGES.NAME_REQUIRED,
  });
}
