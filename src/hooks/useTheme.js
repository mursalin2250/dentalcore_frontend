import { useCallback, useEffect, useState } from "react";
import { THEMES, THEME_STORAGE_KEY } from "@/constants/theme";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === THEMES.LIGHT || saved === THEMES.DARK) return saved;
  } catch {
    // Storage can be blocked (private mode); fall through to the OS setting.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle(THEMES.DARK, theme === THEMES.DARK);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore: the theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
    [],
  );

  return { theme, toggleTheme };
}
