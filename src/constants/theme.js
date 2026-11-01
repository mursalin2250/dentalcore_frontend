export const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
});

// Also hard-coded in index.html (pre-paint script). Change both together.
export const THEME_STORAGE_KEY = "dentalcore-theme";
export const ACCENT_STORAGE_KEY = "dentalcore-accent";

export const ACCENT_PRESETS = Object.freeze([
  { id: "violet", label: "Violet", light: "#6d4ae5", dark: "#8f73f5", softLight: "#f2eefe", softDark: "#221c3d" },
  { id: "blue", label: "Blue", light: "#2563eb", dark: "#60a5fa", softLight: "#eff6ff", softDark: "#1e3a5f" },
  { id: "teal", label: "Teal", light: "#0d9488", dark: "#2dd4bf", softLight: "#f0fdfa", softDark: "#134e4a" },
  { id: "green", label: "Green", light: "#16a34a", dark: "#4ade80", softLight: "#f0fdf4", softDark: "#14532d" },
  { id: "rose", label: "Rose", light: "#e11d48", dark: "#fb7185", softLight: "#fff1f2", softDark: "#4c0519" },
  { id: "orange", label: "Orange", light: "#ea580c", dark: "#fb923c", softLight: "#fff7ed", softDark: "#7c2d12" },
  { id: "slate", label: "Slate", light: "#475569", dark: "#94a3b8", softLight: "#f8fafc", softDark: "#1e293b" },
  { id: "indigo", label: "Indigo", light: "#4f46e5", dark: "#818cf8", softLight: "#eef2ff", softDark: "#1e1b4b" },
]);

export const DEFAULT_ACCENT_ID = "violet";
