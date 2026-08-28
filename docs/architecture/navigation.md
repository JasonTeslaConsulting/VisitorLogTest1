# Navigation and layout

**Navigation** — `Navbar` (`platform/src/app/layout/Navbar.tsx`) driven by the `_arch.menu` → `_arch.screen`
→ `_arch.module` join, via `useNavMenu()` (TanStack Query, `platform/src/hooks/menu/useNavMenu.ts`).
`Navbar` itself is composition only — the header shell, the loading skeleton, the direct link for
single-screen modules, and the account pill (a `secondary`-variant `rounded-full` button). It
delegates the rest to three siblings in `platform/src/app/layout/`: `ModuleDropdown` (a module with more
than one screen), `MobileSidebar` (the backdrop + slide-in drawer below `lg`), and `MenuIcon`
(used by all three).

The bar **floats**: the sticky `<header>` owns the gutter (`px-4 py-4 sm:px-6`) and an opaque
`bg-background`, and the inner div is the `rounded-lg border bg-card` surface that appears to float
in it. Both halves are load-bearing — the gutter is padding on the sticky element rather than a
margin on the card, because a margin collapses against `top-0` on scroll; and the fill must be
opaque or page content scrolls up through the gutter. Total height is 88px, which is what the
samples' `scroll-mt-24` / `sticky top-24` clear. The card is capped at `--container-max`, the same
token `PageLayout`'s inner wrapper reads, so the bar's edges line up with the content beneath it.

Left to right the bar is `home icon → divider → menu items → (flex space) → account menu`, per
DESIGN.md §6. The divider is `hidden lg:block`, matching the nav it separates. Nav dropdown
triggers take no background on hover or while open (text goes primary), and a single-screen module's
direct link follows the same treatment so the two read alike; items inside a dropdown
carry no icon and highlight on `bg-muted` — a nav-scoped override passed as `DropdownMenuLinkItem`'s
`className`, so `cn()`/tailwind-merge resolves the primitive's `focus:bg-accent` away. Every other
menu in the app still highlights on accent.

Pointer cursors in the bar are all explicit. Tailwind's preflight sets `<button> { cursor: default }`
and `DropdownMenuLinkItem` ships `cursor-default`, so the trigger and the menu items each need
`cursor-pointer`; the direct links get it too, redundantly for an anchor today but not if one is ever
swapped for the repo's `Button render={<Link/>}` convention.

`MenuIcon` owns icon resolution: `_arch.menu.menuicon` is stored as a string name, looked up in
that file's `MENU_ICON_MAP` against `react-icons/pi`, falling back to `PiCircle` when the name is
missing or unmapped. Add new icon names there, not at the call site. The map's keys are lucide-era
names mapped onto Phosphor components, so the legal value is `"Home"`, **not** the component name
`"PiHouse"` — an unmapped name warns once in the dev console (the fallback still renders, since a
bad DB row must not blank the nav).

Active-route logic is `LayoutUtils.isActive()` / `LayoutUtils.isModuleActive()`
(`platform/src/lib/layoutUtils.ts`, imported via the `@/lib` barrel). All three nav components share it —
don't re-derive `pathname.startsWith(...)` inline.

Mobile intentionally keeps the hamburger/drawer pattern rather than DESIGN.md's literal icon-only
top bar (documented deviation, see `tailwind.md`).

The home icon's glyph is the one piece of the bar a portal can configure without editing framework
code: `app.homeIcon` in `public/config/app.json`, defaulted in `appConfig.ts`. `npm run docs:check`
fails the build if it isn't a `MENU_ICON_MAP` key, so a typo doesn't reach a browser to be
mistaken for a styling bug.

**Layout** — `PageLayout` in `platform/src/app/layout/` wraps `Navbar` + page content + `BackToTop`.
It passes nothing in: the bar opens with the home icon, so there is no logo slot and no
`portalName` in the header. `public/images/logo.png` is still used by the login page and still
needs swapping per project. `portalName` is read there too; `companyName` is now read nowhere at
all.
