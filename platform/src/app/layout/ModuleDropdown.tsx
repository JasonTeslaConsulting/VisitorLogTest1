import { LayoutUtils } from "@framework/lib";
import type { NavModule } from "@framework/types/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@framework/components/ui/dropdown-menu";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { MenuIcon } from "./MenuIcon";
import { PiCaretDown } from "react-icons/pi";
import { Link } from "react-router";
import { Button } from "@framework/components/ui/button";

type ModuleDropdownProps = {
  module: NavModule;
  pathname: string;
  onNavigate?: () => void;
};

export const ModuleDropdown = ({
  module,
  pathname,
  onNavigate,
}: ModuleDropdownProps) => {
  const active = LayoutUtils.isModuleActive(pathname, module);
  const representativeIcon = module.screens[0]?.menuicon ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              // ghost carries a background on hover, on aria-expanded AND on
              // dark:hover, so all three need answering: tailwind-merge treats
              // `dark:hover:` as a different key from `hover:`, so overriding only the
              // unprefixed pair leaves an open trigger tinted and a dark-mode hover lit.
              "cursor-pointer hover:bg-transparent hover:text-primary aria-expanded:bg-transparent aria-expanded:text-primary dark:hover:bg-transparent",
              active ? "text-primary font-semibold" : "text-muted-foreground",
            )}
            startIcon={
              <MenuIcon name={representativeIcon} className="size-4" />
            }
            endIcon={<PiCaretDown size={13} className="mt-px opacity-70" />}
          >
            <span>{module.modulename}</span>
          </Button>
        }
      />

      <DropdownMenuContent align="start" className="w-52">
        {module.screens.map((screen) => (
          <DropdownMenuLinkItem
            key={screen.screenid}
            // The override belongs here, not on the Link: DropdownMenuLinkItem runs
            // cn(base, className), so tailwind-merge resolves focus:bg-accent away
            // deterministically. On the Link it would be Base UI's mergeProps
            // concatenating strings, where the winner depends on class order.
            // Base UI moves DOM focus to the highlighted item, so focus: IS the
            // mouse-hover style — a hover: variant would double-style keyboard users.
            className="cursor-pointer focus:bg-muted focus:text-foreground"
            render={
              <Link
                to={screen.urladdress}
                onClick={onNavigate}
                className={cn(
                  "w-full",
                  LayoutUtils.isActive(pathname, screen.urladdress) &&
                    "text-primary font-medium",
                )}
              >
                {screen.screentitle || screen.screenname}
              </Link>
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
