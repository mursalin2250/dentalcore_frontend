import { CalendarCheck, Pulse, UserPlus, Users } from "@phosphor-icons/react";

export const PATIENT_STATUSES = Object.freeze({
  ADMITTED: "admitted",
  IN_TREATMENT: "in_treatment",
  COMPLETED: "completed",
  INACTIVE: "inactive",
});

export const PATIENT_STATUS_LABELS = Object.freeze({
  [PATIENT_STATUSES.ADMITTED]: "Admitted",
  [PATIENT_STATUSES.IN_TREATMENT]: "In treatment",
  [PATIENT_STATUSES.COMPLETED]: "Completed",
  [PATIENT_STATUSES.INACTIVE]: "Inactive",
});

export const PATIENT_STATUS_TONES = Object.freeze({
  [PATIENT_STATUSES.ADMITTED]: "info",
  [PATIENT_STATUSES.IN_TREATMENT]: "warning",
  [PATIENT_STATUSES.COMPLETED]: "success",
  [PATIENT_STATUSES.INACTIVE]: "neutral",
});

export const GENDERS = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
});

export const GENDER_LABELS = Object.freeze({
  [GENDERS.MALE]: "Male",
  [GENDERS.FEMALE]: "Female",
  [GENDERS.OTHER]: "Other",
});

export const BLOOD_TYPES = Object.freeze([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

export const STATUS_FILTER_ALL = "all";
export const PATIENT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const SKELETON_ROW_COUNT = 5;
export const MAX_AVATAR_BYTES = 1_500_000;

export const PATIENT_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  BULK_DELETE: "bulk_delete",
  ADD_PRESCRIPTION: "add_prescription",
  ASSIGN_DOCTOR: "assign_doctor",
});

const toOptions = (values, labels) => values.map((value) => ({ value, label: labels[value] }));

export const STATUS_OPTIONS = toOptions(Object.values(PATIENT_STATUSES), PATIENT_STATUS_LABELS);
export const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  ...toOptions(Object.values(GENDERS), GENDER_LABELS),
];
export const BLOOD_TYPE_OPTIONS = [
  { value: "", label: "Unknown" },
  ...BLOOD_TYPES.map((value) => ({ value, label: value })),
];
export const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: "All statuses" },
  ...STATUS_OPTIONS,
];

export const PATIENT_STAT_CARDS = [
  { key: "total", label: "Total Patients", icon: Users, tone: "primary" },
  { key: "newThisMonth", label: "New This Month", icon: UserPlus, tone: "success" },
  { key: "inTreatment", label: "Currently in treatment", icon: Pulse, tone: "warning" },
  { key: "appointmentsToday", label: "Appointments Today", icon: CalendarCheck, tone: "info" },
];

export const PATIENT_MESSAGES = Object.freeze({
  DELETE_DESCRIPTION: "This patient record will be permanently removed. This cannot be undone.",
  BULK_DELETE_DESCRIPTION: (count) =>
    `${count} selected patient${count === 1 ? "" : "s"} will be permanently removed. This cannot be undone.`,
  DELETED: (name) => `${name} was removed.`,
  BULK_DELETED: (count) => `${count} patient${count === 1 ? "" : "s"} removed.`,
  ADDED: (name) => `${name} was added.`,
  UPDATED: (name) => `${name} was updated.`,
  PRESCRIPTION_ADDED: "Prescription added.",
  MEDICINE_REQUIRED: "Enter at least the first medicine.",
  NAME_REQUIRED: "Enter the patient's name.",
  PHONE_REQUIRED: "Enter the patient's phone number.",
  PHOTO_TOO_LARGE: "Choose a photo under 1.5 MB.",
  DOCTOR_ASSIGNED: "Doctor assigned.",
});

export const PATIENT_TEXT = Object.freeze({
  LIST_TITLE: "Patients",
  LIST_DESCRIPTION: "Patient records, treatment status and contact details.",
  SEARCH_PLACEHOLDER: "Search by name, ID, phone or email",
  SEARCH_LABEL: "Search patients",
  EMPTY_TITLE: "No patients yet",
  EMPTY_DESCRIPTION: "Add the first patient to start building your records.",
  EMPTY_FILTER_TITLE: "No patients found",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or status filter.",
  DETAILS_TITLE: "Patient details",
  ASSIGNED_DOCTOR: "Assigned doctor",
  NO_DOCTOR: "No doctor assigned",
  ASSIGN_DOCTOR: "Assign",
  CHANGE_DOCTOR: "Change doctor",
  PAYMENT_HISTORY: "Payment history",
  VISIT_HISTORY: "Visit history",
  NO_VISITS: "No visits recorded yet.",
  NO_PAYMENTS: "No payments recorded yet.",
  NO_PRESCRIPTIONS: "No prescriptions on file yet.",
  PRINT: "Print PDF",
  EDIT: "Edit patient",
  ADD: "Add patient",
  VIEW_DETAILS: "View details",
  DELETE: "Delete",
  SELECT: "Select",
  DONE_SELECTING: "Done",
  BULK_DELETE: "Delete selected",
  PATIENT_ID: "Patient ID",
  PATIENT_ID_HINT: "Leave blank to generate automatically.",
  PROBLEM: "Problem / complaint",
  TREATMENT: "Treatment plan",
  VISIT_COUNT: "Visits completed",
  LAST_VISIT: "Last visit",
  ADD_PRESCRIPTION: "Add prescription",
  MEDICINE: "Medicine",
  ADD_MEDICINE_FIELD: "Add another medicine",
  VIEW_DOCTOR: "Details",
  OVERVIEW: "Overview",
  PRESCRIPTION: "Prescription",
  PHOTO: "Photo",
  DOCTOR: "Doctor",
  NO_DOCTOR_OPTION: "No doctor",
  TREATMENT_COST: "Treatment cost",
  INITIAL_PAYMENT: "Initial payment",
  AMOUNT_PAID: "Amount paid",
  DUE_AMOUNT: "Due amount",
  MONEY_HINT: "Amount in taka. Leave blank for zero.",
});

export const APPOINTMENT_STATUS_LABELS = Object.freeze({
  scheduled: "Scheduled",
  in_chair: "In chair",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
});
