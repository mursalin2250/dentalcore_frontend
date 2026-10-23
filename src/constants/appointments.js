import { CalendarCheck, CheckCircle, Clock, Users } from "@phosphor-icons/react";

// Prefix used in dashboard copy (e.g. "Dr. Name").
export const DOCTOR_TITLE = "Dr.";

export const APPOINTMENT_STATUSES = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  RESCHEDULED: "rescheduled",
});

export const APPOINTMENT_STATUS_LABELS = Object.freeze({
  [APPOINTMENT_STATUSES.PENDING]: "Pending",
  [APPOINTMENT_STATUSES.CONFIRMED]: "Confirmed",
  [APPOINTMENT_STATUSES.COMPLETED]: "Completed",
  [APPOINTMENT_STATUSES.CANCELLED]: "Cancelled",
  [APPOINTMENT_STATUSES.NO_SHOW]: "No show",
  [APPOINTMENT_STATUSES.RESCHEDULED]: "Rescheduled",
});

export const APPOINTMENT_STATUS_TONES = Object.freeze({
  [APPOINTMENT_STATUSES.PENDING]: "warning",
  [APPOINTMENT_STATUSES.CONFIRMED]: "info",
  [APPOINTMENT_STATUSES.COMPLETED]: "success",
  [APPOINTMENT_STATUSES.CANCELLED]: "neutral",
  [APPOINTMENT_STATUSES.NO_SHOW]: "danger",
  [APPOINTMENT_STATUSES.RESCHEDULED]: "info",
});

export const APPOINTMENT_STATUS_META = Object.freeze(
  Object.fromEntries(
    Object.values(APPOINTMENT_STATUSES).map((status) => [
      status,
      { label: APPOINTMENT_STATUS_LABELS[status], tone: APPOINTMENT_STATUS_TONES[status] },
    ]),
  ),
);

export const APPOINTMENT_STATUS_OPTIONS = Object.values(APPOINTMENT_STATUSES).map((value) => ({
  value,
  label: APPOINTMENT_STATUS_LABELS[value],
}));

export const STATUS_FILTER_ALL = "all";
export const DOCTOR_FILTER_ALL = "all";
export const APPOINTMENT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_DURATION_MINUTES = 30;
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120].map((m) => ({
  value: String(m),
  label: `${m} min`,
}));

export const APPOINTMENT_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
  NOTES: "notes",
  DETAILS: "details",
});

export const APPOINTMENT_STAT_CARDS = [
  { key: "todayTotal", label: "Today's Appointments", icon: CalendarCheck, tone: "primary" },
  { key: "pending", label: "Pending", icon: Clock, tone: "warning" },
  { key: "completed", label: "Completed", icon: CheckCircle, tone: "success" },
  { key: "doctorsPresentToday", label: "Doctors Present Today", icon: Users, tone: "info" },
];

export const APPOINTMENT_MESSAGES = Object.freeze({
  CREATED: "Appointment booked.",
  UPDATED: "Appointment updated.",
  DELETED: "Appointment removed.",
  NOTE_ADDED: "Note added.",
  PATIENT_REQUIRED: "Select a patient.",
  DOCTOR_REQUIRED: "Select a doctor.",
  START_REQUIRED: "Choose a date and time.",
  RESCHEDULE_TIME_REQUIRED: "Choose a new date and time to reschedule.",
  DELETE_DESCRIPTION: "This appointment will be permanently removed.",
});

export const APPOINTMENT_TEXT = Object.freeze({
  LIST_TITLE: "Appointments",
  LIST_DESCRIPTION: "Schedule visits, track status, and manage the clinic calendar.",
  ADD: "Add appointment",
  EDIT: "Edit appointment",
  DELETE: "Delete",
  NOTES: "Notes",
  ADD_NOTE: "Add note",
  SEARCH_PLACEHOLDER: "Search by patient or doctor",
  SEARCH_LABEL: "Search appointments",
  EMPTY_TITLE: "No appointments",
  EMPTY_DESCRIPTION: "Book the first visit to fill the calendar.",
  EMPTY_FILTER_TITLE: "No matches",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or filters.",
  EMPTY_DAY_TITLE: "Free day",
  EMPTY_DAY_DESCRIPTION: "Nothing booked for this date. Add a visit when a patient is ready.",
  EMPTY_DAY_ACTION: "Book appointment",
  CALENDAR: "Calendar",
  DAY_PANEL: "Day schedule",
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  DATE: "Date",
  TIME: "Time",
  DURATION: "Duration",
  REASON: "Reason",
  STATUS: "Status",
  NOTE: "Note (optional)",
  NEW_DATE_TIME: "New date & time",
  STATUS_FILTER: "All statuses",
  DOCTOR_FILTER: "All doctors",
  FROM: "From",
  TO: "To",
  ACTIONS: "Actions",
  VIEW_NOTES: "Notes",
  VIEW_DETAILS: "View details",
  DETAILS_TITLE: "Visit details",
  ORIGINAL_TIME: "Originally scheduled",
  CREATED_AT: "Booked on",
  UPDATED_AT: "Last updated",
  NO_NOTES: "No notes on this visit yet.",
  NO_REASON: "No reason recorded.",
  PREV_MONTH: "Previous month",
  NEXT_MONTH: "Next month",
});
