"use client";

import { useTheme } from "@framework/contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * The toast container. Every toast that lands in it is rendered by
 * `@framework/components/ui/toast`, which uses `toast.custom` — so sonner sets `data-styled=false`
 * and none of its own card styling applies.
 *
 * That is why `richColors`, the `icons` map and the `toastOptions.classNames` overrides are gone:
 * all four only affect `[data-styled=true]` toasts, so once every toast is custom they were dead
 * configuration that read as if it were doing something. Styling lives in toast.tsx now.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
