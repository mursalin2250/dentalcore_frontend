export const ROUTES = Object.freeze({
  ROOT: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  NOT_FOUND: "*",

  DASHBOARD: "/dashboard",

  PATIENTS: "/patients",
  PATIENT_DETAILS: "/patients/:id",
  DOCTORS: "/doctors",
  DOCTOR_DETAILS: "/doctors/:id",
  APPOINTMENTS: "/appointments",

  MEDICATIONS: "/medications",
  STOCK_MOVEMENT: "/stock-movement",

  INVOICE: "/invoice",
  INVOICE_NEW: "/invoice/new",
  INVOICE_EDIT: "/invoice/:id/edit",
  ANALYTICS: "/analytics",
  STAFF: "/staff",

  TEAM: "/team",
  SETTINGS: "/settings",

  // User menu
  PROFILE: "/profile",
  ACCOUNT_SETTINGS: "/account-settings",
});
