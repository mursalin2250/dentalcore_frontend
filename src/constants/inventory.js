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
