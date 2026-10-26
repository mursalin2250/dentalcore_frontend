import { CalendarCheck, Stethoscope, UserPlus, Users } from "@phosphor-icons/react";

export const DOCTOR_PAGE_SIZE = 12;
export const SEARCH_DEBOUNCE_MS = 300;
export const SPECIALTY_FILTER_ALL = "all";
export const MAX_AVATAR_BYTES = 1_500_000;

export const DOCTOR_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
});

export const DOCTOR_STAT_CARDS = [
  { key: "total", label: "Total Doctors", icon: Stethoscope, tone: "primary" },
  { key: "specialties", label: "Specialties", icon: UserPlus, tone: "info" },
  { key: "patientsAssigned", label: "Patients assigned", icon: Users, tone: "success" },
  { key: "appointmentsToday", label: "Appointments Today", icon: CalendarCheck, tone: "warning" },
];

export const DOCTOR_MESSAGES = Object.freeze({
  NAME_REQUIRED: "Enter the doctor's name.",
  PHOTO_TOO_LARGE: "Choose a photo under 1.5 MB.",
  ADDED: (name) => `${name} was added.`,
  UPDATED: (name) => `${name} was updated.`,
  DELETED: (name) => `${name} was removed.`,
  DELETE_DESCRIPTION: "This doctor will be removed. Assigned patients will be unassigned.",
});

export const DOCTOR_TEXT = Object.freeze({
  LIST_TITLE: "Doctors",
  LIST_DESCRIPTION: "Dentists and specialists, their profiles and assigned patients.",
  SEARCH_PLACEHOLDER: "Search by name, specialty or phone",
  SEARCH_LABEL: "Search doctors",
  EMPTY_TITLE: "No doctors yet",
  EMPTY_DESCRIPTION: "Add the first doctor to start building your roster.",
  EMPTY_FILTER_TITLE: "No doctors found",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or specialty filter.",
  DETAILS_TITLE: "Doctor details",
  ADD: "Add doctor",
  EDIT: "Edit doctor",
  VIEW_PROFILE: "View profile",
  DELETE: "Delete",
  OVERVIEW: "Overview",
  CURRENT_PATIENTS: "Current patients",
  NO_PATIENTS: "No patients assigned yet.",
  PATIENTS_TREATED: "Patients treated",
  IN_TREATMENT: "Currently in treatment",
  APPOINTMENTS_TODAY: "Appointments today",
  PATIENTS_ASSIGNED: "Patients assigned",
  LAST_VISIT: "Last visit",
  SPECIALTY: "Specialty",
  DESIGNATION: "Designation",
  PHONE: "Phone",
  EMAIL: "Email",
  PHOTO: "Photo",
  SPECIALTY_FILTER: "All specialties",
});
