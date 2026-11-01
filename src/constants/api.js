// Prefer a relative path so Vite can proxy /api and LAN/ngrok stay same-origin.
export const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const HTTP_METHODS = Object.freeze({
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  DELETE: "DELETE",
});

export const HTTP_STATUS = Object.freeze({
  UNAUTHORIZED: 401,
});

export const API_ENDPOINTS = Object.freeze({
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  TEAM: "/team",
  teamMember: (id) => `/team/${id}`,
  DASHBOARD_SUMMARY: "/dashboard/summary",
  DASHBOARD_REVENUE: "/dashboard/revenue",
  DASHBOARD_UPCOMING_APPOINTMENTS: "/dashboard/appointments/upcoming",
  DASHBOARD_LOW_STOCK: "/dashboard/stock/low",
  DASHBOARD_ACTIVITY: "/dashboard/activity",
  PATIENTS: "/patients",
  PATIENTS_STATS: "/patients/stats",
  patient: (id) => `/patients/${id}`,
  PATIENTS_BULK_DELETE: "/patients/bulk/delete",
  patientPrescriptions: (id) => `/patients/${id}/prescriptions`,
  DOCTORS: "/doctors",
  DOCTORS_STATS: "/doctors/stats",
  doctor: (id) => `/doctors/${id}`,
  INVOICES: "/invoices",
  INVOICES_STATS: "/invoices/stats",
  invoice: (id) => `/invoices/${id}`,
  invoicePayments: (id) => `/invoices/${id}/payments`,
  invoiceVoidPayment: (id, paymentId) => `/invoices/${id}/payments/${paymentId}/void`,
  MEDICATIONS: "/medications",
  MEDICATIONS_STATS: "/medications/stats",
  medication: (id) => `/medications/${id}`,
  STOCK_MOVEMENTS: "/stock-movements",
  STOCK_MOVEMENTS_STATS: "/stock-movements/stats",
  APPOINTMENTS: "/appointments",
  APPOINTMENTS_STATS: "/appointments/stats",
  appointment: (id) => `/appointments/${id}`,
  STAFF: "/staff",
  STAFF_STATS: "/staff/stats",
  staff: (id) => `/staff/${id}`,
  staffAttendance: (id) => `/staff/${id}/attendance`,
  staffAttendanceDay: (id, date) => `/staff/${id}/attendance/${date}`,
  staffSalary: (id) => `/staff/${id}/salary`,
  STAFF_ATTENDANCE_BULK: "/staff/attendance/bulk",
  STAFF_LEAVE: "/staff/leave",
  SETTINGS: "/settings",
  settingsExport: (collection) => `/settings/export/${collection}`,
  USERS_ME: "/users/me",
  USERS_ME_PREFERENCES: "/users/me/preferences",
  USERS_ME_PASSWORD: "/users/me/password",
  USERS_ME_LOGOUT_ALL: "/users/me/logout-all",
  USERS_ME_AVATAR: "/users/me/avatar",
});

export const API_MESSAGES = Object.freeze({
  NETWORK: "Cannot reach the server. Check your connection and try again.",
  UNKNOWN: "Something went wrong. Please try again.",
});
