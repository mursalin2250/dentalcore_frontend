import { useCallback, useEffect, useState } from "react";
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT_ID,
  THEMES,
  THEME_STORAGE_KEY,
} from "@/constants/theme";

function resolveMode(mode) {
  if (mode === THEMES.SYSTEM) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.DARK : THEMES.LIGHT;
  }
  return mode === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

function getInitialMode() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === THEMES.LIGHT || saved === THEMES.DARK || saved === THEMES.SYSTEM) return saved;
  } catch {
    /* private mode */
  }
  return THEMES.SYSTEM;
}

function getInitialAccent() {
  try {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (saved && ACCENT_PRESETS.some((p) => p.id === saved)) return saved;
  } catch {
    /* */
  }
  return DEFAULT_ACCENT_ID;
}

function applyAccent(accentId, resolvedTheme) {
  const preset = ACCENT_PRESETS.find((p) => p.id === accentId) || ACCENT_PRESETS[0];
  const root = document.documentElement;
  const isDark = resolvedTheme === THEMES.DARK;
  root.style.setProperty("--primary", isDark ? preset.dark : preset.light);
  root.style.setProperty("--primary-soft", isDark ? preset.softDark : preset.softLight);
  root.style.setProperty("--primary-foreground", isDark ? "#0d0d14" : "#ffffff");
}

export function useTheme() {
  const [mode, setMode] = useState(getInitialMode);
  const [accentId, setAccentId] = useState(getInitialAccent);
  const resolved = resolveMode(mode === THEMES.LIGHT || mode === THEMES.DARK || mode === THEMES.SYSTEM ? mode : THEMES.SYSTEM);

  useEffect(() => {
    const effective = resolveMode(mode);
    document.documentElement.classList.toggle(THEMES.DARK, effective === THEMES.DARK);
    applyAccent(accentId, effective);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      localStorage.setItem(ACCENT_STORAGE_KEY, accentId);
    } catch {
      /* */
    }
  }, [mode, accentId]);

  useEffect(() => {
    const onExternal = () => {
      setMode(getInitialMode());
      setAccentId(getInitialAccent());
    };
    window.addEventListener("dentalcore-appearance", onExternal);
    return () => window.removeEventListener("dentalcore-appearance", onExternal);
  }, []);

  useEffect(() => {
    if (mode !== THEMES.SYSTEM) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.classList.toggle(THEMES.DARK, mq.matches);
      applyAccent(accentId, mq.matches ? THEMES.DARK : THEMES.LIGHT);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, accentId]);

  const toggleTheme = useCallback(() => {
    setMode((m) => {
      const current = resolveMode(m);
      return current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    });
  }, []);

  return {
    theme: resolved,
    mode,
    setMode,
    accentId,
    setAccentId,
    toggleTheme,
  };
}
