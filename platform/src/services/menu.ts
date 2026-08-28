/**
 * menuService.ts
 *
 * Fetches navigation structure from _arch schema tables using the Supabase Data API.
 * Joins: _arch.menu -> _arch.screen -> _arch.module
 *
 * This is the ONLY file that calls Supabase for navigation/menu purposes.
 * Components import from here - never from supabase directly.
 */

import { supabase } from "@framework/integrations/supabase/client";
import type { NavModule } from "@framework/types/navigation";

// ---------------------------------------------------------------------------
// Raw shape returned by Supabase when joining menu -> screen -> module
// ---------------------------------------------------------------------------

type RawMenuRow = {
  menuid: string;
  menuname: string;
  menuicon: string | null;
  menuorder: number | null;
  screen: {
    screenid: string;
    screenname: string;
    screentitle: string;
    urladdress: string;
    module: {
      moduleid: string;
      modulename: string;
      sortorder: number | null;
    } | null;
  } | null;
};

// ---------------------------------------------------------------------------
// getNavMenu
//
// Fetches top-level menu entries (parentmenuid is null), joined to their screen and module,
// then groups into NavModule[]. Note it does NOT filter on displaymenuflag — RLS on _arch.menu
// decides visibility, so a hidden entry has to be excluded there, not here.
//
// Role-based filtering: relies on Supabase RLS policies on _arch.menu
// to return only rows the authenticated user is allowed to see.
// The organizationUserId param is available here if you need to add
// an explicit .eq() filter beyond what RLS provides.
// ---------------------------------------------------------------------------

export async function getNavMenu(): Promise<NavModule[]> {
  // organizationUserId not needed -> use RLS (uses auth.uid())to return correct list of menu items
  // also prevent hijacking payload
  const { data, error } = await supabase
    .schema("_arch")
    .from("menu")
    .select(
      `
      menuid,
      menuname,
      menuicon,
      menuorder,
      screen:screenid (
        screenid,
        screenname,
        screentitle,
        urladdress,
        module:moduleid (
          moduleid,
          modulename,
          sortorder
        )
      )
    `,
    )
    .is("parentmenuid", null)
    .order("menuorder", { ascending: true });

  if (error) throw new Error(error.message);
  return groupByModule(data as RawMenuRow[]);
}

// ---------------------------------------------------------------------------
// groupByModule
//
// Transforms flat menu rows into NavModule[] sorted by module.sortorder.
// Screens within each module are sorted by menuorder.
// ---------------------------------------------------------------------------

function groupByModule(rows: RawMenuRow[]): NavModule[] {
  const moduleMap = new Map<string, NavModule>();

  for (const row of rows) {
    const screen = row.screen;
    if (!screen) continue;

    const mod = screen.module;
    if (!mod) continue;

    if (!moduleMap.has(mod.moduleid)) {
      moduleMap.set(mod.moduleid, {
        moduleid: mod.moduleid,
        modulename: mod.modulename,
        sortorder: mod.sortorder,
        screens: [],
      });
    }

    moduleMap.get(mod.moduleid)!.screens.push({
      screenid: screen.screenid,
      screenname: screen.screenname,
      screentitle: screen.screentitle,
      urladdress: screen.urladdress,
      menuicon: row.menuicon,
      menuorder: row.menuorder,
    });
  }

  // Sort modules by sortorder, then screens within each module by menuorder
  return Array.from(moduleMap.values())
    .sort((a, b) => (a.sortorder ?? 999) - (b.sortorder ?? 999))
    .map((mod) => ({
      ...mod,
      screens: mod.screens.sort(
        (a, b) => (a.menuorder ?? 999) - (b.menuorder ?? 999),
      ),
    }));
}
