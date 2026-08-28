import type { NavModule } from "@framework/types/navigation";

export function isActive(pathname: string, urladdress: string): boolean {
  return pathname === urladdress || pathname.startsWith(urladdress + "/");
}

export function isModuleActive(pathname: string, module: NavModule): boolean {
  return module.screens.some((s) => isActive(pathname, s.urladdress));
}
