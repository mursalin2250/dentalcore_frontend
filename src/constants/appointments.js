export const APPOINTMENT_STATUSES = Object.freeze({
  SCHEDULED: "scheduled",
  IN_CHAIR: "in_chair",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
});

// `tone` is a Badge tone.
export const APPOINTMENT_STATUS_META = Object.freeze({
  [APPOINTMENT_STATUSES.SCHEDULED]: { label: "Scheduled", tone: "neutral" },
  [APPOINTMENT_STATUSES.IN_CHAIR]: { label: "In chair", tone: "warning" },
  [APPOINTMENT_STATUSES.COMPLETED]: { label: "Completed", tone: "success" },
  [APPOINTMENT_STATUSES.CANCELLED]: { label: "Cancelled", tone: "danger" },
  [APPOINTMENT_STATUSES.NO_SHOW]: { label: "No show", tone: "danger" },
});

export const DOCTOR_TITLE = "Dr.";
