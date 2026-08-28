import { MenuIcon } from "@framework/app/layout/MenuIcon";
import { DarkModeToggle } from "@framework/components/ui/DarkModeToggle";
import { LayoutUtils } from "@framework/lib";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { NavModule } from "@framework/types/navigation";
import { useEffect } from "react";
import { PiX } from "react-icons/pi";
import { Link } from "react-router";

type SidebarProps = {
  modules: NavModule[];
  pathname: string;
  open: boolean;
  onClose: () => void;
};

export function MobileSidebar({
  modules,
  pathname,
  open,
  onClose,
}: SidebarProps) {
  // Trap body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-background border-r",
          "flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <PiX size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {modules.map((module) => (
            <div key={module.moduleid}>
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {module.modulename}
              </p>
              <ul className="space-y-0.5">
                {module.screens.map((screen) => (
                  <li key={screen.screenid}>
                    <Link
                      to={screen.urladdress}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        LayoutUtils.isActive(pathname, screen.urladdress)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground",
                      )}
                    >
                      <MenuIcon name={screen.menuicon} className="size-4" />
                      {screen.screentitle || screen.screenname}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar footer - dark mode toggle */}
        <div className="border-t px-2 py-3">
          <DarkModeToggle showLabel />
        </div>
      </aside>
    </>
  );
}
