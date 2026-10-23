import {
  ArrowsClockwise,
  ArrowsLeftRight,
  CurrencyCircleDollar,
  Package,
  Pill,
  Toolbox,
  TrendDown,
  TrendUp,
  WarningCircle,
} from "@phosphor-icons/react";

export const MEDICATION_PAGE_SIZE = 10;
export const MOVEMENT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const EXPIRY_SOON_DAYS = 30;

export const MEDICATION_ITEM_TYPES = Object.freeze({
  MEDICINE: "medicine",
  TOOL: "tool",
});

export const MEDICATION_ITEM_TYPE_LABELS = Object.freeze({
  [MEDICATION_ITEM_TYPES.MEDICINE]: "Medicine",
  [MEDICATION_ITEM_TYPES.TOOL]: "Tool",
});

export const MEDICATION_ITEM_TYPE_OPTIONS = Object.values(MEDICATION_ITEM_TYPES).map((value) => ({
  value,
  label: MEDICATION_ITEM_TYPE_LABELS[value],
}));

export const MEDICATION_CATEGORIES = [
  "Analgesic",
  "Antibiotic",
  "Anesthetic",
  "Antiseptic",
  "Consumable",
  "Instrument",
  "Other",
];

export const MEDICATION_CATEGORY_OPTIONS = MEDICATION_CATEGORIES.map((c) => ({ value: c, label: c }));

export const MEDICATION_UNITS = ["pcs", "box", "bottle", "ml", "g", "pack", "tube", "units", "cartridges", "capsules", "tablets", "syringes", "bags"];
export const MEDICATION_UNIT_OPTIONS = MEDICATION_UNITS.map((u) => ({ value: u, label: u }));

export const STOCK_STATUSES = Object.freeze({
  OUT_OF_STOCK: "out_of_stock",
  LOW_STOCK: "low_stock",
  IN_STOCK: "in_stock",
});

export const STOCK_STATUS_LABELS = Object.freeze({
  [STOCK_STATUSES.OUT_OF_STOCK]: "Out of stock",
  [STOCK_STATUSES.LOW_STOCK]: "Low stock",
  [STOCK_STATUSES.IN_STOCK]: "In stock",
});

export const STOCK_STATUS_TONES = Object.freeze({
  [STOCK_STATUSES.OUT_OF_STOCK]: "danger",
  [STOCK_STATUSES.LOW_STOCK]: "warning",
  [STOCK_STATUSES.IN_STOCK]: "success",
});

export const STOCK_STATUS_OPTIONS = Object.values(STOCK_STATUSES).map((value) => ({
  value,
  label: STOCK_STATUS_LABELS[value],
}));

export const EXPIRY_FLAGS = Object.freeze({
  EXPIRED: "expired",
  EXPIRING_SOON: "expiring_soon",
  OK: "ok",
  NONE: "none",
});

export const EXPIRY_FLAG_LABELS = Object.freeze({
  [EXPIRY_FLAGS.EXPIRED]: "Expired",
  [EXPIRY_FLAGS.EXPIRING_SOON]: "Expiring soon",
  [EXPIRY_FLAGS.OK]: "OK",
  [EXPIRY_FLAGS.NONE]: "No expiry",
});

export const EXPIRY_FLAG_TONES = Object.freeze({
  [EXPIRY_FLAGS.EXPIRED]: "danger",
  [EXPIRY_FLAGS.EXPIRING_SOON]: "warning",
  [EXPIRY_FLAGS.OK]: "success",
  [EXPIRY_FLAGS.NONE]: "neutral",
});

export const EXPIRY_FILTER_OPTIONS = [
  { value: EXPIRY_FLAGS.EXPIRED, label: EXPIRY_FLAG_LABELS[EXPIRY_FLAGS.EXPIRED] },
  { value: EXPIRY_FLAGS.EXPIRING_SOON, label: EXPIRY_FLAG_LABELS[EXPIRY_FLAGS.EXPIRING_SOON] },
  { value: EXPIRY_FLAGS.NONE, label: EXPIRY_FLAG_LABELS[EXPIRY_FLAGS.NONE] },
];

export const STOCK_MOVEMENT_TYPES = Object.freeze({
  IN: "in",
  OUT: "out",
  ADJUST: "adjust",
});

export const STOCK_MOVEMENT_LABELS = Object.freeze({
  [STOCK_MOVEMENT_TYPES.IN]: "Stock in",
  [STOCK_MOVEMENT_TYPES.OUT]: "Stock out",
  [STOCK_MOVEMENT_TYPES.ADJUST]: "Adjustment",
});

export const STOCK_MOVEMENT_TONES = Object.freeze({
  [STOCK_MOVEMENT_TYPES.IN]: "success",
  [STOCK_MOVEMENT_TYPES.OUT]: "warning",
  [STOCK_MOVEMENT_TYPES.ADJUST]: "info",
});

export const STOCK_MOVEMENT_TYPE_OPTIONS = Object.values(STOCK_MOVEMENT_TYPES).map((value) => ({
  value,
  label: STOCK_MOVEMENT_LABELS[value],
}));

export const STOCK_IN_REASONS = ["Purchase", "Return", "Transfer in", "Other"];
export const STOCK_OUT_REASONS = ["Used", "Expired", "Damaged", "Transfer out", "Other"];
export const STOCK_ADJUST_REASONS = ["Recount", "Correction", "Other"];

export const MOVEMENT_REASONS = Object.freeze({
  [STOCK_MOVEMENT_TYPES.IN]: STOCK_IN_REASONS,
  [STOCK_MOVEMENT_TYPES.OUT]: STOCK_OUT_REASONS,
  [STOCK_MOVEMENT_TYPES.ADJUST]: STOCK_ADJUST_REASONS,
});

export const FILTER_ALL = "all";

export const MEDICATION_DIALOGS = Object.freeze({
  ADD: "add",
  EDIT: "edit",
  DELETE: "delete",
});

export const MOVEMENT_DIALOGS = Object.freeze({
  ADD: "add",
});

export const MEDICATION_STAT_CARDS = [
  { key: "totalItems", label: "Total items", icon: Pill, tone: "primary" },
  { key: "lowStockCount", label: "Low stock", icon: WarningCircle, tone: "warning" },
  { key: "outOfStockCount", label: "Out of stock", icon: TrendDown, tone: "danger" },
  { key: "inventoryValue", label: "Inventory value", icon: CurrencyCircleDollar, tone: "success", money: true },
];

export const MOVEMENT_STAT_CARDS = [
  { key: "movementsToday", label: "Movements today", icon: ArrowsLeftRight, tone: "primary" },
  { key: "stockInUnits", label: "Stock in (30d)", icon: TrendUp, tone: "success" },
  { key: "stockOutUnits", label: "Stock out (30d)", icon: TrendDown, tone: "warning" },
  { key: "adjustmentsCount", label: "Adjustments (30d)", icon: ArrowsClockwise, tone: "info" },
];

export const MEDICATION_MESSAGES = Object.freeze({
  CREATED: "Medication added.",
  UPDATED: "Medication updated.",
  DELETED: "Medication removed.",
  ARCHIVED: "Medication archived (has movement history).",
  NAME_REQUIRED: "Enter a name.",
  DELETE_DESCRIPTION: "Remove this item from inventory. Items with movement history are archived instead.",
});

export const MOVEMENT_MESSAGES = Object.freeze({
  CREATED: "Stock movement recorded.",
  INSUFFICIENT: "Quantity exceeds available stock.",
  MEDICATION_REQUIRED: "Select a medication.",
  QUANTITY_REQUIRED: "Enter a positive quantity.",
  COUNTED_REQUIRED: "Enter the counted quantity.",
  REASON_REQUIRED: "Choose a reason.",
});

export const MEDICATION_TEXT = Object.freeze({
  LIST_TITLE: "Medications",
  LIST_DESCRIPTION: "Medicines and tools kept in clinic stock.",
  ADD: "Add item",
  EDIT: "Edit item",
  DELETE: "Delete",
  SEARCH_PLACEHOLDER: "Search by name or SKU",
  EMPTY_TITLE: "No medications yet",
  EMPTY_DESCRIPTION: "Add the first medicine or tool to start tracking stock.",
  EMPTY_FILTER_TITLE: "No matches",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or filters.",
  STOCK_READONLY: "Stock changes only through movements.",
  RECORD_MOVEMENT: "Record movement",
  CURRENT_STOCK: "Current stock",
});

export const MOVEMENT_TEXT = Object.freeze({
  LIST_TITLE: "Stock movements",
  LIST_DESCRIPTION: "In, out, and adjustment history for inventory.",
  ADD: "New movement",
  SEARCH_PLACEHOLDER: "Search by medication name or SKU",
  EMPTY_TITLE: "No movements yet",
  EMPTY_DESCRIPTION: "Record a stock in, out, or adjustment to begin history.",
  EMPTY_FILTER_TITLE: "No matches",
  EMPTY_FILTER_DESCRIPTION: "Nothing matches your search or filters.",
  RESULTING_STOCK: "Resulting stock",
  COUNTED_QTY: "Counted quantity",
  QUANTITY: "Quantity",
});
