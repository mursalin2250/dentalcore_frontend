import { PATIENT_MESSAGES } from "@/constants/patients";
import { omitEmpty } from "@/lib/validation";

export function validatePatient({ name, phone }) {
  return omitEmpty({
    name: name?.trim() ? undefined : PATIENT_MESSAGES.NAME_REQUIRED,
    phone: phone?.trim() ? undefined : PATIENT_MESSAGES.PHONE_REQUIRED,
  });
}
