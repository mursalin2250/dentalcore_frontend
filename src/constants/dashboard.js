import {
  ArrowsLeftRight,
  CalendarCheck,
  Coins,
  Pill,
  Receipt,
  UserPlus,
  Users,
} from "@phosphor-icons/react";
import { ROUTES } from "./routes";
import { ROLES } from "./roles";
import { DOCTOR_TITLE } from "./appointments";
import { STOCK_MOVEMENT_LABELS } from "./inventory";

export const DASHBOARD_RANGES = Object.freeze({
  LAST_7_DAYS: "7d",
  LAST_30_DAYS: "30d",
  LAST_12_MONTHS: "12m",
});

export const DASHBOARD_RANGE_OPTIONS = [
  { value: DASHBOARD_RANGES.LAST_7_DAYS, label: "7 days" },
  { value: DASHBOARD_RANGES.LAST_30_DAYS, label: "30 days" },
  { value: DASHBOARD_RANGES.LAST_12_MONTHS, label: "12 months" },
];
export const DEFAULT_DASHBOARD_RANGE = DASHBOARD_RANGES.LAST_7_DAYS;

export const BUCKET_UNITS = Object.freeze({ DAY: "day", MONTH: "month" });

// Must match the server: only these roles are allowed to load revenue.
export const REVENUE_ROLES = Object.freeze([ROLES.ADMIN]);

// LOW_STOCK is the API maximum: the list shows as many rows as fit the card.
export const LIST_LIMITS = Object.freeze({ APPOINTMENTS: 4, LOW_STOCK: 20, ACTIVITY: 4 });

// Must match Tailwind's `xl` breakpoint, where the dashboard switches to three columns.
export const BREAKPOINT_QUERIES = Object.freeze({ XL: "(min-width: 80rem)" });
export const LOW_STOCK_ROW_PX = 65; // h-16 row + 1px divider
export const LOW_STOCK_NARROW_LIMIT = 5; // single-column layouts have no height to fill
export const LOW_STOCK_SKELETON_ROWS = 5;
export const CHART_ANIMATION_MS = 900;
// Minimum chart height (px). On xl the chart grows to fill the remaining card height so the
// revenue + low-stock pair stay equal without a blank band under the graph.
export const CHART_HEIGHT = 228;
// Entrance order: heading, the four KPI cards, then the widgets.
export const WIDGET_INDEX = Object.freeze({ REVENUE: 5, LOW_STOCK: 6, APPOINTMENTS: 7, ACTIVITY: 8 });
export const STAGGER_MS = 60; // delay between widgets as the page enters

export const GREETINGS = Object.freeze({
  MORNING: "Good morning",
  AFTERNOON: "Good afternoon",
  EVENING: "Good evening",
});
export const GREETING_HOURS = Object.freeze({ AFTERNOON_FROM: 12, EVENING_FROM: 17 });

// Order here is the order of the KPI cards. A card the API leaves out (role) is not shown.
export const STAT_CARDS = [
  { key: "patients", label: "Total patients", icon: Users, tone: "primary", format: "number" },
  { key: "appointments", label: "Appointments today", icon: CalendarCheck, tone: "warning", format: "number" },
  { key: "revenue", label: "Revenue this month", icon: Coins, tone: "success", format: "money" },
  { key: "lowStock", label: "Low stock items", icon: Pill, tone: "info", format: "number" },
];

export const DASHBOARD_TEXT = Object.freeze({
  ERROR_TITLE: "Could not load this section",
  RETRY: "Try again",
  VIEW_DETAILS: "View details",
  CHART_LOADING: "Loading chart",
  REVENUE: {
    title: "Revenue",
    description: "Paid invoices, in taka.",
    rangeLabel: "Revenue date range",
    total: "Total for the period",
    emptyTitle: "No payments yet",
    emptyDescription: "Paid invoices in this period will appear here.",
    chartSummary: (total, range) => `Revenue over the last ${range}: ${total}.`,
  },
  APPOINTMENTS: {
    title: "Upcoming appointments",
    description: "The next visits on the book.",
    emptyTitle: "No upcoming appointments",
    emptyDescription: "Booked visits will appear here.",
    withDoctor: (name) => `${DOCTOR_TITLE} ${name}`,
  },
  LOW_STOCK: {
    title: "Low stock",
    description: "Items below reorder level.",
    emptyTitle: "Stock levels look good",
    emptyDescription: "Nothing is below its reorder level.",
    left: (quantity, unit) => `${quantity} ${unit} left`,
  },
  ACTIVITY: {
    title: "Recent activity",
    description: "Latest changes across the clinic.",
    emptyTitle: "No activity yet",
    emptyDescription: "New patients, bookings and payments will show up here.",
  },
});

export const ACTIVITY_TYPES = Object.freeze({
  PATIENT_REGISTERED: "patient_registered",
  APPOINTMENT_BOOKED: "appointment_booked",
  INVOICE_PAID: "invoice_paid",
  STOCK_MOVED: "stock_moved",
});

// `title` is the headline, `detail` the second line. `formatMoney` is passed in by the component.
// `action` is the secondary line under the subject name.
export const ACTIVITY_META = Object.freeze({
  [ACTIVITY_TYPES.PATIENT_REGISTERED]: {
    icon: UserPlus,
    title: (item) => `${item.subject} registered`,
    detail: () => "New patient",
    action: () => "Registered",
  },
  [ACTIVITY_TYPES.APPOINTMENT_BOOKED]: {
    icon: CalendarCheck,
    title: (item) => `Appointment booked for ${item.subject}`,
    detail: (item) => (item.doctor ? `${DOCTOR_TITLE} ${item.doctor}` : ""),
    action: (item) =>
      item.doctor ? `Appointment booked · ${DOCTOR_TITLE} ${item.doctor}` : "Appointment booked",
  },
  [ACTIVITY_TYPES.INVOICE_PAID]: {
    icon: Receipt,
    title: (item) => `Invoice paid by ${item.subject}`,
    detail: (item, { formatMoney }) => formatMoney(item.amount),
    action: (item, { formatMoney }) => `Invoice paid · ${formatMoney(item.amount)}`,
  },
  [ACTIVITY_TYPES.STOCK_MOVED]: {
    icon: ArrowsLeftRight,
    title: (item) => `${item.subject}`,
    detail: (item) => `${STOCK_MOVEMENT_LABELS[item.movementType]} · ${item.quantity}`,
    action: (item) => `${STOCK_MOVEMENT_LABELS[item.movementType]} · ${item.quantity}`,
  },
});

export const DASHBOARD_LINKS = Object.freeze({
  APPOINTMENTS: ROUTES.APPOINTMENTS,
  LOW_STOCK: ROUTES.MEDICATIONS,
});
