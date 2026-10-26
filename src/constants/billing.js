export const INVOICE_STATUSES = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
});

export const INVOICE_STATUS_LABELS = Object.freeze({
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
});

export const INVOICE_STATUS_TONES = Object.freeze({
  pending: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
});

export const INVOICE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((o) => [o.value, o.label]),
);

export const FILTER_ALL = "all";
export const SEARCH_DEBOUNCE_MS = 300;

export const INVOICE_TEXT = Object.freeze({
  LIST_TITLE: "Invoices",
  LIST_DESC: "One invoice per patient. Create, print and record payments.",
  ADD: "New invoice",
  DETAILS_TITLE: "Invoice details",
  RECORD_PAYMENT: "Record payment",
  PRINT: "Print",
  TOTAL_COST: "Total",
  AMOUNT_PAID: "Paid",
  AMOUNT_DUE: "Due",
});

export const INVOICE_DIALOGS = Object.freeze({
  DETAILS: "details",
  PAYMENT: "payment",
  DELETE: "delete",
});

export const INVOICE_MESSAGES = Object.freeze({
  CREATED: "Invoice created.",
  UPDATED: "Invoice updated.",
  PAYMENT_ADDED: "Payment recorded.",
  DELETED: "Invoice deleted.",
});
