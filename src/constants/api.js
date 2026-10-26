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
});

export const API_MESSAGES = Object.freeze({
  NETWORK: "Cannot reach the server. Check your connection and try again.",
  UNKNOWN: "Something went wrong. Please try again.",
});
