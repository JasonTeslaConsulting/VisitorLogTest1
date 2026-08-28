import {
  PiCaretDown,
  PiSignOut,
  PiUser,
  PiList,
  PiX,
  PiHouse,
  PiUsers,
  PiGear,
  PiFileText,
  PiChartBar,
  PiShield,
  PiBell,
  PiCalendar,
  PiFolder,
  PiClipboardText,
  PiSquaresFour,
  PiBuildings,
  PiPackage,
  PiCreditCard,
  PiQuestion,
  PiEnvelope,
  PiChatCircle,
  PiMagnifyingGlass,
  PiLock,
  PiKey,
  PiUserGear,
  PiBriefcase,
  PiClipboard,
  PiFileXls,
  PiTrendUp,
  PiCurrencyDollar,
  PiReceipt,
  PiTruck,
  PiWarehouse,
  PiGlobe,
  PiWrench,
  PiStack,
  PiArchive,
  PiShareNetwork,
  PiClockCounterClockwise,
  PiWarning,
  PiBookOpen,
  PiDatabase,
  PiHardDrives,
  PiBuilding,
  PiCircle,
} from "react-icons/pi";
import type { IconType } from "react-icons";

// Icons
// Per-screen menu icons come from _arch.menu.menuicon as a string name.
// Unmapped/missing names fall back to a generic icon rather than rendering nothing.
const MENU_ICON_MAP: Record<string, IconType> = {
  Home: PiHouse,
  Users: PiUsers,
  Settings: PiGear,
  FileText: PiFileText,
  BarChart3: PiChartBar,
  Shield: PiShield,
  Bell: PiBell,
  Calendar: PiCalendar,
  Folder: PiFolder,
  ClipboardList: PiClipboardText,
  LayoutDashboard: PiSquaresFour,
  Building2: PiBuildings,
  Package: PiPackage,
  CreditCard: PiCreditCard,
  HelpCircle: PiQuestion,
  Mail: PiEnvelope,
  MessageSquare: PiChatCircle,
  Search: PiMagnifyingGlass,
  Lock: PiLock,
  Key: PiKey,
  UserCog: PiUserGear,
  Briefcase: PiBriefcase,
  ClipboardCheck: PiClipboard,
  FileSpreadsheet: PiFileXls,
  TrendingUp: PiTrendUp,
  DollarSign: PiCurrencyDollar,
  Receipt: PiReceipt,
  Truck: PiTruck,
  Warehouse: PiWarehouse,
  Globe: PiGlobe,
  Wrench: PiWrench,
  Layers: PiStack,
  Archive: PiArchive,
  Network: PiShareNetwork,
  History: PiClockCounterClockwise,
  TriangleAlert: PiWarning,
  BookOpen: PiBookOpen,
  Database: PiDatabase,
  Server: PiHardDrives,
  Building: PiBuilding,
};

// Names already reported, so a nav that renders on every route warns once per name
// rather than once per render.
const warnedIconNames = new Set<string>();

export function MenuIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  // A missing/unmapped name still renders — a bad DB row or config value must not
  // blank out the nav. But it used to do so in complete silence, which is how
  // `PiHouse` (a Phosphor component name, not a key of this map) would look like a
  // styling bug rather than a typo. Dev-only: production users can't act on it.
  if (import.meta.env.DEV && name && !MENU_ICON_MAP[name]) {
    if (!warnedIconNames.has(name)) {
      warnedIconNames.add(name);
      console.warn(
        `[MenuIcon] "${name}" is not a key of MENU_ICON_MAP — falling back to a ` +
          `generic icon. Legal values are that map's keys in ` +
          `platform/src/app/layout/MenuIcon.tsx (e.g. "Home", not "PiHouse"); ` +
          `add the name there, not at the call site.`,
      );
    }
  }

  const Icon = (name && MENU_ICON_MAP[name]) || PiCircle;
  return <Icon className={className} aria-hidden />;
}
//
