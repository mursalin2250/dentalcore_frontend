import { Moon, Sun } from "@phosphor-icons/react";
import IconButton from "@/components/ui/IconButton";
import { useTheme } from "@/hooks/useTheme";
import { THEMES } from "@/constants/theme";

// Both icons share one grid cell; CSS cross-fades them via the `dark:` variant.
const ICON_BASE =
  "col-start-1 row-start-1 transition-[opacity,transform] duration-200 ease-out-strong motion-reduce:transition-none";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;

  return (
    <IconButton
      label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    >
      <Moon className={`${ICON_BASE} dark:scale-90 dark:opacity-0`} />
      <Sun className={`${ICON_BASE} scale-90 opacity-0 dark:scale-100 dark:opacity-100`} />
    </IconButton>
  );
}
