export const STAFF_STATUS_LABELS = Object.freeze({
  active: "Active",
  on_leave: "On leave",
  inactive: "Inactive",
});
export const STAFF_STATUS_TONES = Object.freeze({
  active: "success",
  on_leave: "warning",
  inactive: "neutral",
});
export const TODAY_STATUS_LABELS = Object.freeze({
  present: "Present",
  late: "Late",
  half_day: "Half day",
  absent: "Absent",
  on_leave: "On leave",
  weekly_off: "Weekly off",
  not_marked: "Not marked",
});
export const TODAY_STATUS_TONES = Object.freeze({
  present: "success",
  late: "warning",
  half_day: "warning",
  absent: "danger",
  on_leave: "info",
  weekly_off: "neutral",
  not_marked: "neutral",
});
export const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
  { value: "absent", label: "Absent" },
  { value: "on_leave", label: "On leave" },
];
export const LEAVE_TYPE_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];
export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];
export const SHIFT_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "custom", label: "Custom" },
];
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const STAFF_ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "assistant", label: "Assistant" },
  { value: "other", label: "Other" },
];
export const STAFF_ROLE_LABELS = Object.freeze({
  doctor: "Doctor",
  assistant: "Assistant",
  other: "Other",
});
