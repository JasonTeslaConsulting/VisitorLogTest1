/**
 * DarkModeToggle.tsx
 *
 * Supports "light" | "dark" | "system".
 *
 * - Default (no props): icon-only button for navbar use
 * - showLabel: renders with a text label for sidebar use
 */

import { PiMoon, PiSun, PiMonitor } from "react-icons/pi";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { useTheme } from "@framework/contexts/ThemeContext";
import { Button } from "@framework/components/ui/button";

type DarkModeToggleProps = {
  /** text label beside the icon - for sidebar/settings contexts */
  showLabel?: boolean;
  className?: string;
};

const THEME_CYCLE = ["light", "dark", "system"] as const;
type Theme = (typeof THEME_CYCLE)[number];

const THEME_CONFIG: Record<Theme, { icon: React.ReactNode; label: string }> = {
  light: { icon: <PiSun size={16} />, label: "Light mode" },
  dark: { icon: <PiMoon size={16} />, label: "Dark mode" },
  system: { icon: <PiMonitor size={16} />, label: "System" },
};

export const DarkModeToggle = ({
  showLabel = false,
  className,
}: DarkModeToggleProps) => {
  const { theme, setTheme } = useTheme();

  // Cycle through light -> dark -> system on each click
  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme as Theme);
    const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    setTheme(nextTheme);
  };

  const current = THEME_CONFIG[theme as Theme] ?? THEME_CONFIG.system;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to switch.`}
      className={cn(showLabel ? "px-3 py-2 w-full text-sm" : "p-2", className)}
    >
      {current.icon}
      {showLabel && <span>{current.label}</span>}
    </Button>
  );
};
