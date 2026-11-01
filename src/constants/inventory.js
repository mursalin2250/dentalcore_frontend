export const STOCK_MOVEMENT_TYPES = Object.freeze({
  IN: "in",
  OUT: "out",
  ADJUST: "adjust",
});

export const STOCK_MOVEMENT_LABELS = Object.freeze({
  [STOCK_MOVEMENT_TYPES.IN]: "Stock in",
  [STOCK_MOVEMENT_TYPES.OUT]: "Stock out",
  [STOCK_MOVEMENT_TYPES.ADJUST]: "Stock adjustment",
});

export const STOCK_MOVEMENT_TONES = Object.freeze({
  in: "success",
  out: "danger",
  adjust: "warning",
});

export const STOCK_STATUS_LABELS = Object.freeze({
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
});

export const STOCK_STATUS_TONES = Object.freeze({
  in: "success",
  low: "warning",
  out: "danger",
});

export const ITEM_TYPE_OPTIONS = [
  { value: "medicine", label: "Medicine" },
  { value: "tool", label: "Tool" },
];

export const UNIT_OPTIONS = [
  { value: "pcs", label: "pcs" },
  { value: "box", label: "box" },
  { value: "ml", label: "ml" },
  { value: "mg", label: "mg" },
  { value: "bottle", label: "bottle" },
  { value: "pack", label: "pack" },
];
