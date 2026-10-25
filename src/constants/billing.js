import { CheckCircle, Clock, CurrencyCircleDollar, WarningCircle } from "@phosphor-icons/react";

export const INVOICE_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const FILTER_ALL = "all";
export const INVOICE_OVERDUE_DAYS = 30;

export const INVOICE_STATUSES = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
});

export const INVOICE_STATUS_LABELS = Object.freeze({
  [INVOICE_STATUSES.PENDING]: "Pending",
  [INVOICE_STATUSES.PAID]: "Paid",
  [INVOICE_STATUSES.OVERDUE]: "Overdue",
  [INVOICE_STATUSES.CANCELLED]: "Cancelled",
});

export const INVOICE_STATUS_TONES = Object.freeze({
  [INVOICE_STATUSES.PENDING]: "warning",
  [INVOICE_STATUSES.PAID]: "success",
  [INVOICE_STATUSES.OVERDUE]: "danger",
  [INVOICE_STATUSES.CANCELLED]: "neutral",
});

export const INVOICE_STATUS_OPTIONS = Object.values(INVOICE_STATUSES).map((value) => ({
  value,
  label: INVOICE_STATUS_LABELS[value],
}));

export const PAYMENT_METHODS = Object.freeze({
  CASH: "cash",
  CARD: "card",
  BKASH: "bkash",
  NAGAD: "nagad",
  BANK: "bank",
  OTHER: "other",
});

export const PAYMENT_METHOD_LABELS = Object.freeze({
  [PAYMENT_METHODS.CASH]: "Cash",
  [PAYMENT_METHODS.CARD]: "Card",
  [PAYMENT_METHODS.BKASH]: "bKash",
  [PAYMENT_METHODS.NAGAD]: "Nagad",
  [PAYMENT_METHODS.BANK]: "Bank transfer",
  [PAYMENT_METHODS.OTHER]: "Other",
});

export const PAYMENT_METHOD_OPTIONS = Object.values(PAYMENT_METHODS).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export const INVOICE_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  PAYMENT: "payment",
  DETAILS: "details",
  DELETE: "delete",
});

export const INVOICE_STAT_CARDS = [
  { key: "outstanding", label: "Outstanding", icon: CurrencyCircleDollar, tone: "warning", money: true },
  { key: "collected", label: "Collected", icon: CheckCircle, tone: "success", money: true },
  { key: "pending", label: "Pending", icon: Clock, tone: "info" },
  { key: "overdue", label: "Overdue", icon: WarningCircle, tone: "danger" },
];

export const INVOICE_MESSAGES = Object.freeze({
  CREATED: "Invoice created.",
  UPDATED: "Invoice updated.",
  DELETED: "Invoice removed.",
  PAYMENT_ADDED: "Payment recorded.",
  PATIENT_REQUIRED: "Select a patient.",
  TOTAL_REQUIRED: "Enter the total cost.",
  AMOUNT_REQUIRED: "Enter the payment amount.",
  METHOD_REQUIRED: "Choose a payment method.",
  DELETE_DESCRIPTION: "Invoices with payments are cancelled instead of deleted.",
});

export const INVOICE_TEXT = Object.freeze({
  LIST_TITLE: "Invoices",
  LIST_DESCRIPTION: "One invoice per patient — charges, payments and balances.",
  ADD: "New invoice",
  EDIT: "Edit invoice",
  RECORD_PAYMENT: "Record payment",
  SEARCH_PLACEHOLDER: "Search by patient or invoice number",
  EMPTY_TITLE: "No invoices yet",
  EMPTY_DESCRIPTION: "Create an invoice for a patient to track charges and payments.",
  EMPTY_FILTER_TITLE: "No matches",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or filters.",
  DETAILS_TITLE: "Invoice details",
  AMOUNT_DUE: "Amount due",
  AMOUNT_PAID: "Amount paid",
  TOTAL_COST: "Total cost",
});
