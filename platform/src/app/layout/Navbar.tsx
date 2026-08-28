/**
 * Navbar
 *
 * Framework-level navbar driven by _arch.module + _arch.screen + _arch.menu tables.
 * - A floating bar: the sticky <header> owns the gutter and an opaque page-coloured
 *   background, the inner div is the card that appears to float in it. The background
 *   is load-bearing — without it page content scrolls up through the gutter.
 * - Desktop: home icon + divider, then per-module dropdown menus. The home glyph is
 *   portal-configurable (`app.homeIcon` in public/config/app.json, resolved through
 *   MENU_ICON_MAP like every other nav icon)
 * - Mobile: hamburger -> slide-in sidebar (a deliberate deviation from DESIGN.md's
 *   literal "same top bar, icon-only, labels hidden" mobile spec — the drawer scales
 *   better for modules with many screens; DESIGN.md's Composition Patterns section
 *   explicitly permits deviating from defaults when content needs a different structure)
 * - Menu data fetched via Supabase Data API through menuService
 * - All Supabase calls go through the service layer, never directly here
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "@framework/components/ui/toast";
import { AUTH } from "@framework/lib/constants/app";
import { appConfig } from "@framework/app/appConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@framework/components/ui/dropdown-menu";
import { Button } from "@framework/components/ui/button";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { useAuth } from "@framework/contexts/AuthContext";
import { useNavMenu } from "@framework/hooks/menu/useNavMenu";
import { SAMPLE_NAV_MODULES } from "@framework/lib/constants/sampleNav";
import { DarkModeToggle } from "@framework/components/ui/DarkModeToggle";
import { LayoutUtils } from "@framework/lib";
import { MenuIcon } from "@framework/app/layout/MenuIcon";
import { PiCaretDown, PiList, PiSignOut, PiUser } from "react-icons/pi";
import { MobileSidebar } from "./MobileSidebar";
import { ModuleDropdown } from "./ModuleDropdown";

type NavbarProps = {
  // Called on successful logout - defaults to navigating to AUTH.LOGIN_PATH
  onLogout?: () => void;
};

export const Navbar = ({ onLogout }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On any /sample route, show the hardcoded sample menu instead of the
  // Supabase-driven one — those pages are reached only by typing the URL, and
  // useNavMenu is gated on organizationUserId, so an unauthenticated visitor
  // would otherwise see no nav at all. useNavMenu is still called unconditionally
  // (React hooks can't be conditional); its result is just not used here.
  const isSampleRoute = location.pathname.startsWith("/sample");
  const { data: fetchedModules = [], isLoading: isMenuLoading } = useNavMenu();
  const modules = isSampleRoute ? SAMPLE_NAV_MODULES : fetchedModules;
  const isLoading = isSampleRoute ? false : isMenuLoading;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate(AUTH.LOGIN_PATH);
      toast.success("Logged out successfully");
    }
  };

  const displayName = currentUser?.fullname || currentUser?.email || "Account";
  const { homeIcon } = appConfig.config.app;

  return (
    <>
      {/* The gutter is padding on the sticky element, not a margin on the card:
          a margin would collapse against `top-0` the moment the page scrolls, so
          the gap would exist at rest and vanish in use. bg-background makes the
          gutter opaque — page content would otherwise scroll up through it.
          Capped at --container-max, the same token PageLayout's inner wrapper
          reads, so the bar's edges line up with the content beneath it. */}
      <header className="sticky top-0 z-30 bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-(--container-max) rounded-lg border bg-card px-4 sm:px-6">
          <div className="flex h-14 items-center gap-4">
            {/* Mobile: hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <PiList size={20} />
            </Button>

            {/* Home icon -> divider -> menu items, per DESIGN.md §6. MenuIcon marks
                the svg aria-hidden, so the accessible name lives on the Link. */}
            <Link
              to={AUTH.REDIRECT_PATH}
              aria-label="Home"
              className="shrink-0 text-primary transition-opacity hover:opacity-80"
            >
              <MenuIcon name={homeIcon} className="size-5" />
            </Link>

            {/* Hidden with the nav it separates — below lg the nav is a drawer, so
                the rule would divide the icon from nothing. */}
            <div className="hidden h-6 w-px bg-border lg:block" aria-hidden />

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex flex-1 items-center gap-1"
              aria-label="Main navigation"
            >
              {isLoading ? (
                // Skeleton placeholders while loading
                <div className="flex gap-2">
                  {[80, 64, 96].map((w) => (
                    <div
                      key={w}
                      className="h-8 rounded-md bg-muted animate-pulse"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              ) : (
                modules.map((module) =>
                  module.screens.length === 1 ? (
                    // Single-screen module -> direct link, no dropdown
                    <Link
                      key={module.moduleid}
                      to={module.screens[0].urladdress}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        // Same hover treatment as a ModuleDropdown trigger: primary
                        // text, no background. A single-screen module sits at the same
                        // level of the nav, so it should not read as a different
                        // affordance just because it skips the popup. cursor-pointer is
                        // already an anchor default, but stated so that swapping this
                        // for a Button (the repo's link convention) can't silently
                        // regress it to cursor-default.
                        "cursor-pointer hover:bg-transparent hover:text-primary",
                        LayoutUtils.isActive(
                          location.pathname,
                          module.screens[0].urladdress,
                        )
                          ? "text-primary font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      <MenuIcon
                        name={module.screens[0].menuicon}
                        className="size-4"
                      />
                      {module.screens[0].screenname}
                    </Link>
                  ) : (
                    <ModuleDropdown
                      key={module.moduleid}
                      module={module}
                      pathname={location.pathname}
                    />
                  ),
                )
              )}
            </nav>

            {/* Right slot: dark mode toggle (desktop only) + account menu */}
            <div className="ml-auto flex items-center gap-1">
              {/* Hidden on mobile - mobile toggle lives in the sidebar footer */}
              <div className="hidden lg:block">
                <DarkModeToggle />
              </div>

              <DropdownMenu>
                {/* Base UI composes via `render`, not Radix's `asChild` — without it
                    Menu.Trigger renders its own <button> around Button's, which is
                    invalid HTML and a nested interactive control. */}
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full font-medium"
                      endIcon={<PiCaretDown size={13} className="opacity-70" />}
                    >
                      <span className="hidden sm:inline text-sm">
                        {displayName}
                      </span>
                    </Button>
                  }
                />

                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">
                      Signed in as
                    </p>
                    <p className="text-sm font-medium truncate">
                      {displayName}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLinkItem
                    render={
                      <Link to="/profile" className="flex items-center gap-2">
                        <PiUser size={15} />
                        Profile
                      </Link>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive data-highlighted:text-destructive"
                  >
                    <PiSignOut size={15} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        modules={modules}
        pathname={location.pathname}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
};
