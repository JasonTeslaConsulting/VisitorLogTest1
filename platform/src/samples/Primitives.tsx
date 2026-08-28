import { useEffect, useRef, useState } from "react";
import { toast } from "@framework/components/ui/toast";
import {
  PiTray,
  PiPlus,
  PiInfo,
  PiWarning,
  PiCheckCircle,
  PiHouse,
  PiUsers,
  PiGear,
  PiFileText,
  PiChartBar,
  PiShield,
  PiBell,
  PiCalendar,
  PiFolder,
  PiDownloadSimple,
  PiFunnel,
  PiArrowsClockwise,
  PiTrash,
  PiCaretRight,
  PiLock,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { Button } from "@framework/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardMedia,
  CardContent,
  CardFooter,
} from "@framework/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@framework/components/ui/sheet";
import { EmptyState } from "@framework/components/ui/EmptyState";
import { useTheme } from "@framework/contexts/ThemeContext";
import { rgbStringToHex, rgbStringToOklch } from "@framework/lib/colorUtils";
import { DatePicker } from "@framework/components/ui/DatePicker";
import { DateTimePicker } from "@framework/components/ui/DateTimePicker";
import { TimePicker } from "@framework/components/ui/TimePicker";
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { Pagination } from "@framework/components/ui/datatable/Pagination";
import { Checkbox } from "@framework/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@framework/components/ui/radio-group";
import { Switch } from "@framework/components/ui/switch";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@framework/components/ui/field";
import { Input } from "@framework/components/ui/input";
import { Textarea } from "@framework/components/ui/textarea";
import { Badge } from "@framework/components/ui/badge";
import { Skeleton } from "@framework/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@framework/components/ui/combobox";
import { MultiSelect } from "@framework/components/ui/MultiSelect";
import { Chip } from "@framework/components/ui/chip";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@framework/components/ui/alert";
import {
  HighlightPanel,
  HighlightPanelTitle,
  HighlightPanelDescription,
} from "@framework/components/ui/HighlightPanel";
import { UnsavedChangesDialog } from "@framework/components/ui/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "@framework/hooks/useUnsavedChangesGuard";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@framework/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@framework/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@framework/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@framework/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@framework/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@framework/components/ui/breadcrumb";
import { Link } from "react-router";

// ---------------------------------------------------------------------------
// This page is a standalone dev/QA reference — every component here reflects
// its actual live styling, not a screenshot. Section list mirrors the Figma
// reference (TC Design Library). See DESIGN.md and tailwind.md at the repo
// root for the underlying token spec this page is checked against.
// ---------------------------------------------------------------------------

/**
 * Demo option lists. Deliberately long enough to be worth searching — a six-item combobox proves
 * nothing about whether the filter works.
 */
const COUNTRIES = [
  { value: "au", label: "Australia" },
  { value: "br", label: "Brazil" },
  { value: "ca", label: "Canada" },
  { value: "de", label: "Germany" },
  { value: "in", label: "India" },
  { value: "id", label: "Indonesia" },
  { value: "jp", label: "Japan" },
  { value: "my", label: "Malaysia" },
  { value: "nz", label: "New Zealand" },
  { value: "sg", label: "Singapore" },
  { value: "za", label: "South Africa" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
  { value: "vn", label: "Vietnam" },
];

const PERMISSIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "approve", label: "Approve" },
  { value: "publish", label: "Publish" },
  { value: "archive", label: "Archive" },
  { value: "export", label: "Export" },
  { value: "audit", label: "Audit" },
  { value: "admin", label: "Administer" },
];

const SECTIONS = [
  { id: "colors", label: "Color Palette" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing & Grid" },
  { id: "radius", label: "Radius" },
  { id: "icons", label: "Icons" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "selects", label: "Selects" },
  { id: "combobox", label: "Searchable Select" },
  { id: "multi-select", label: "Multi-Select" },
  { id: "textareas", label: "Text Areas" },
  { id: "checkboxes", label: "Checkboxes" },
  { id: "radios", label: "Radio Buttons" },
  { id: "switches", label: "Switches" },
  { id: "tags", label: "Tags" },
  { id: "badges", label: "Badges" },
  { id: "alerts", label: "Alerts" },
  { id: "toasts", label: "Toasts" },
  { id: "modals", label: "Modals" },
  { id: "side-sheet", label: "Side sheet" },
  { id: "tables", label: "Tables" },
  { id: "pagination", label: "Pagination" },
  { id: "tabs", label: "Tabs" },
  { id: "accordions", label: "Accordions" },
  { id: "cards", label: "Cards" },
  { id: "highlight-panel", label: "Highlighted Panel" },
  { id: "navigation", label: "Navigation" },
  { id: "breadcrumbs", label: "Breadcrumbs" },
  { id: "empty-state", label: "Empty States" },
  { id: "loading-states", label: "Skeleton Loading States" },
  { id: "error-states", label: "Error States" },
  // { id: "charts", label: "Charts" },
  // { id: "kpi-cards", label: "KPI Cards" },
  { id: "date-pickers", label: "Date Pickers" },
  { id: "date-time-pickers", label: "Date & Time Pickers" },
];

const RAMP_STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

type PaletteGroup = "Brand and Accent" | "Surface" | "Text" | "Functional";

type PaletteSwatch = {
  label: string;
  varName: string;
  bg: string;
  fg: string;
  group: PaletteGroup;
  note: string;
};

const SEMANTIC_ROLE_SWATCHES = [
  // --- Brand and Accent ---
  {
    label: "Primary",
    varName: "--primary",
    bg: "bg-primary",
    fg: "text-primary-foreground",
    group: "Brand and Accent",
    note: "The one accent — primary buttons, active nav, links inside tables. One primary action per screen.",
  },
  {
    label: "Primary Hover",
    varName: "--primary-hover",
    bg: "bg-primary-hover",
    fg: "text-primary-foreground",
    group: "Brand and Accent",
    note: "Hover/pressed state of a primary button. Darkens in light mode, lightens in dark.",
  },
  {
    label: "Secondary",
    varName: "--secondary",
    bg: "bg-secondary",
    fg: "text-secondary-foreground",
    group: "Brand and Accent",
    note: "Standard (non-primary) buttons and strong neutral fills. Flips to near-white in dark mode.",
  },
  {
    label: "Secondary Hover",
    varName: "--secondary-hover",
    bg: "bg-secondary-hover",
    fg: "text-secondary-foreground",
    group: "Brand and Accent",
    note: "Hover/pressed state of a secondary button. Light mode only — dark mode dims the near-white fill instead.",
  },
  {
    label: "Accent",
    varName: "--accent",
    bg: "bg-accent",
    fg: "text-accent-foreground",
    group: "Brand and Accent",
    note: "Pale primary tint — nav and menu item hover, selected menu rows.",
  },

  // --- Surface ---
  {
    label: "Background",
    varName: "--background",
    bg: "bg-background",
    fg: "text-foreground",
    group: "Surface",
    note: "The page canvas. Everything sits on this unless it's a card.",
  },
  {
    label: "Card",
    varName: "--card",
    bg: "bg-card",
    fg: "text-card-foreground",
    group: "Surface",
    note: "Cards, popovers, dialogs — one step lighter than the canvas. That contrast, not a shadow, is what lifts them.",
  },
  {
    label: "Highlight",
    varName: "--highlight",
    bg: "bg-highlight",
    fg: "text-foreground",
    group: "Surface",
    note: "Focused or called-out content: instructional banners, table row hover, selected rows.",
  },
  {
    label: "Border",
    varName: "--border",
    bg: "bg-border",
    fg: "text-foreground",
    group: "Surface",
    note: "1px card edges, dividers, table header underline. The default separator everywhere.",
  },
  {
    label: "Border Dark",
    varName: "--border-dark",
    bg: "bg-border-dark",
    fg: "text-foreground",
    group: "Surface",
    note: "Field outlines — inputs, selects, textareas, calendar cells. Anything needing a visible resting-state edge, not a hairline.",
  },
  {
    label: "Muted",
    varName: "--muted",
    bg: "bg-muted",
    fg: "text-muted-foreground",
    group: "Surface",
    note: "Subdued fills: table header strips, zebra striping, filled input backgrounds.",
  },

  // --- Text ---
  {
    label: "Text",
    varName: "--foreground",
    bg: "bg-foreground",
    fg: "text-background",
    group: "Text",
    note: "Headings, body copy, icons, and text in light buttons.",
  },
  {
    label: "Subtitle",
    varName: "--muted-foreground",
    bg: "bg-muted-foreground",
    fg: "text-background",
    group: "Text",
    note: "Least-emphasis text — subtitles, captions, help text under fields. Same token as Muted's foreground.",
  },
  {
    label: "On Dark",
    varName: "--primary-foreground",
    bg: "bg-primary-foreground",
    fg: "text-foreground",
    group: "Text",
    note: "Text and icons on a dark fill (primary and secondary buttons). White in both modes for Primary; Secondary's on-color flips to the dark canvas navy in dark mode.",
  },
  {
    label: "Disabled Text",
    varName: "--disabled-text",
    bg: "bg-disabled-text",
    fg: "text-foreground",
    group: "Text",
    note: "Disabled text and icons. Not the fill of a disabled button — that's a separate token.",
  },

  // --- Functional ---
  {
    label: "Error",
    varName: "--destructive",
    bg: "bg-destructive",
    fg: "text-destructive-foreground",
    group: "Functional",
    note: "Validation messages, destructive confirmation, error states.",
  },
  {
    label: "Error Hover",
    varName: "--destructive-hover",
    bg: "bg-destructive-hover",
    fg: "text-destructive-foreground",
    group: "Functional",
    note: "Hover/pressed state of a destructive button. Darkens in light mode, lightens in dark.",
  },
  {
    label: "Warning",
    varName: "--warning",
    bg: "bg-warning",
    fg: "text-warning-foreground",
    group: "Functional",
    note: "Caution callouts — icon fills, chip backgrounds, shapes. Too light for body text; use Warning Text.",
  },
  {
    label: "Warning Text",
    varName: "--warning-text",
    bg: "bg-warning-text",
    fg: "text-primary-foreground",
    group: "Functional",
    note: "Caution wording on a light surface. Passes AA at 5.08:1, where the base Warning is 2.26:1.",
  },
  {
    label: "Success",
    varName: "--success",
    bg: "bg-success",
    fg: "text-success-foreground",
    group: "Functional",
    note: "Positive confirmation — icon fills, chip backgrounds, shapes. Use Success Text for wording.",
  },
  {
    label: "Success Text",
    varName: "--success-text",
    bg: "bg-success-text",
    fg: "text-primary-foreground",
    group: "Functional",
    note: "Positive confirmation in text, on a light surface. 5.35:1 on white.",
  },
  {
    label: "Link Blue",
    varName: "--info",
    bg: "bg-info",
    fg: "text-info-foreground",
    group: "Functional",
    note: "Anchor links in prose. Table entity links use Primary instead.",
  },
] satisfies PaletteSwatch[];

const PALETTE_GROUPS: PaletteGroup[] = [
  "Brand and Accent",
  "Surface",
  "Text",
  "Functional",
];

const TYPE_SCALE = [
  {
    name: "display-lg",
    className: "font-heading text-display-lg font-extrabold",
  },
  {
    name: "headline-lg",
    className: "font-heading text-headline-lg font-bold",
  },
  {
    name: "headline-md",
    className: "font-heading text-headline-md font-bold",
  },
  {
    name: "title-lg",
    className: "font-heading text-title-lg font-semibold",
  },
  {
    name: "subtitle",
    className: "font-heading text-subtitle font-medium",
  },
  { name: "body-lg", className: "text-body-lg" },
  { name: "body-md", className: "text-body-md" },
  { name: "button", className: "text-button font-semibold" },
  { name: "label-sm", className: "text-label-sm font-medium" },
];

const SPACE_SCALE = [
  { name: "space-1 (4px)", className: "w-1 h-1" },
  { name: "space-2 (8px)", className: "w-2 h-2" },
  { name: "space-3 (12px)", className: "w-3 h-3" },
  { name: "space-4 (16px)", className: "w-4 h-4" },
  { name: "space-6 (24px)", className: "w-6 h-6" },
  { name: "space-8 (32px)", className: "w-8 h-8" },
  { name: "space-12 (48px)", className: "w-12 h-12" },
  { name: "space-16 (64px)", className: "w-16 h-16" },
];

/**
 * DESIGN.md §5's radius scale. `role` is the spec's own "Used by" column — kept here so the
 * showcase states the assignment, not just the shape.
 *
 * `full` has no `varName`: Tailwind compiles `rounded-full` to a literal `calc(infinity * 1px)`
 * rather than a `var()`, so unlike sm/md/lg it cannot be retuned from src/theme.css. That is by
 * design, not a gap (DESIGN.md §5), and the tile says so — otherwise the first person who wants a
 * softer pill goes looking for a `--radius-full` token that does not exist.
 */
const RADIUS_SCALE: {
  name: string;
  varName: string | null;
  className: string;
  role: string;
}[] = [
  {
    name: "rounded-sm",
    varName: "--radius-sm",
    className: "rounded-sm",
    role: "Fields, buttons, checkboxes",
  },
  {
    name: "rounded-md",
    varName: "--radius-md",
    className: "rounded-md",
    role: "Cards, popovers, menus",
  },
  {
    name: "rounded-lg",
    varName: "--radius-lg",
    className: "rounded-lg",
    role: "Modals, sheets",
  },
  {
    name: "rounded-full",
    varName: null,
    className: "rounded-full",
    role: "Avatars, badges, switches, radios",
  },
];

const ICON_SAMPLES: { icon: IconType; name: string }[] = [
  { icon: PiHouse, name: "PiHouse" },
  { icon: PiUsers, name: "PiUsers" },
  { icon: PiGear, name: "PiGear" },
  { icon: PiFileText, name: "PiFileText" },
  { icon: PiChartBar, name: "PiChartBar" },
  { icon: PiShield, name: "PiShield" },
  { icon: PiBell, name: "PiBell" },
  { icon: PiCalendar, name: "PiCalendar" },
  { icon: PiFolder, name: "PiFolder" },
];

function Section({
  id,
  title,
  description,
  bare,
  children,
}: {
  id: string;
  title: string;
  /** ReactNode, not string — a description may carry an inline link. */
  description: React.ReactNode;
  /** Skip the wrapping card — for sections that already demo a Card themselves (no nested cards) */
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt clears the floating navbar (py-4 + h-14 = 88px) plus a little air.
    <section id={id} className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="font-heading text-title-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {bare ? (
        children
      ) : (
        <Card>
          <CardContent>{children}</CardContent>
        </Card>
      )}
    </section>
  );
}

function Subsection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * The fields-in-a-modal sample, wired to `useUnsavedChangesGuard` so the section demonstrates the
 * guard rather than describing it: type something, then try to close by any route — the X, Cancel,
 * Esc or the backdrop — and the confirmation appears instead.
 *
 * Real pages pass `form.formState.isDirty` as `when`. This sample has no react-hook-form instance,
 * so a plain boolean flipped by the first edit is the honest equivalent.
 */
function GuardedFieldsDialog() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({ when: dirty });

  // Closing always clears the flag. Without it the page stays "dirty" after the dialog is gone, so
  // route navigation keeps prompting about a form the user can no longer see. A real page gets this
  // for free — react-hook-form's isDirty resets when the form unmounts.
  const setOpenAndReset = (next: boolean) => {
    setOpen(next);
    if (!next) setDirty(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (next) setDirty(false);
        guard.guardOpenChange(setOpenAndReset)(next, details);
      }}
    >
      <DialogTrigger
        render={<Button variant="outline">With fields (guarded)</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogDescription>
            A modal can carry a form. A side sheet can too — ask which one the
            page wants rather than assuming, and reach for the sheet when the
            action comes off a datatable.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="modal-name">Full name</FieldLabel>
            <Input
              id="modal-name"
              placeholder="Ada Lovelace"
              onChange={() => setDirty(true)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="modal-email">Email</FieldLabel>
            <Input
              id="modal-email"
              type="email"
              placeholder="ada@example.com"
              onChange={() => setDirty(true)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="modal-role">Role</FieldLabel>
            <Input
              id="modal-role"
              placeholder="Engineering"
              onChange={() => setDirty(true)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => guard.requestClose(() => setOpenAndReset(false))}
          >
            Cancel
          </Button>
          <Button onClick={() => setOpenAndReset(false)}>Save</Button>
        </DialogFooter>
        <UnsavedChangesDialog guard={guard} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * A labelled slot for one card example. Deliberately NOT `Subsection`, which wraps its children in
 * a Card — components-rules.md forbids nesting cards, and that is why the Cards section is `bare`.
 */
function CardExample({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * The side-sheet edit form. Same guard as GuardedFieldsDialog — a form loses its input the same way
 * in either container, so both are wired identically.
 *
 * This is the container DESIGN.md §7 points at for anything opened from a datatable: the list stays
 * visible behind the sheet, so the user keeps their place. See ManagementTables for that in situ.
 */
function GuardedEditSheet() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({ when: dirty });

  const setOpenAndReset = (next: boolean) => {
    setOpen(next);
    if (!next) setDirty(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (next) setDirty(false);
        guard.guardOpenChange(setOpenAndReset)(next, details);
      }}
    >
      <SheetTrigger
        render={<Button variant="outline">Edit form (guarded)</Button>}
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit vendor</SheetTitle>
          <SheetDescription>
            Editing an existing record keeps the user on the page behind the
            sheet, rather than navigating away from it.
          </SheetDescription>
        </SheetHeader>
        <FieldGroup className="px-4">
          <Field>
            <FieldLabel htmlFor="sheet-vendor">Vendor name</FieldLabel>
            <Input
              id="sheet-vendor"
              defaultValue="Acme Industrial"
              onChange={() => setDirty(true)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-contact">Primary contact</FieldLabel>
            <Input
              id="sheet-contact"
              defaultValue="Jane Doe"
              onChange={() => setDirty(true)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sheet-notes">Notes</FieldLabel>
            <Textarea
              id="sheet-notes"
              placeholder="Anything the next person should know"
              onChange={() => setDirty(true)}
            />
          </Field>
        </FieldGroup>
        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => guard.requestClose(() => setOpenAndReset(false))}
          >
            Cancel
          </Button>
          <Button onClick={() => setOpenAndReset(false)}>Save changes</Button>
        </SheetFooter>
        <UnsavedChangesDialog guard={guard} />
      </SheetContent>
    </Sheet>
  );
}

/**
 * A radius tile whose px value is read from the live computed style, same reasoning as Swatch
 * below: typed-in numbers drift from src/theme.css the moment someone retunes a token, and the
 * point of this section is to prove what the tokens currently resolve to.
 *
 * No `theme` dependency — the radius scale is mode-invariant (src/theme.css's own comment on the
 * block), unlike the colors.
 */
function RadiusTile({
  name,
  varName,
  className,
  role,
}: {
  name: string;
  varName: string | null;
  className: string;
  role: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!boxRef.current) return;
    // `rounded-full` computes to a huge literal (calc(infinity * 1px)), so reporting it as px
    // would be noise. varName === null is the marker for "pinned, not token-driven".
    if (!varName) {
      setValue("pinned — not retunable");
      return;
    }
    setValue(getComputedStyle(boxRef.current).borderTopLeftRadius);
  }, [varName]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={boxRef}
        className={`size-16 border border-border-dark bg-card ${className}`}
      />
      <div className="text-center">
        <p className="font-mono text-label-sm text-foreground">{name}</p>
        <p className="font-mono text-label-sm text-muted-foreground">
          {varName ?? "no token"} · {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

/**
 * A palette tile whose hex/OKLCH values are read from the live computed style, not typed in —
 * so they can never drift from index.css and update automatically when the theme changes. See
 * src/lib/colorUtils.ts.
 */
function Swatch({
  label,
  varName,
  bg,
  fg,
  note,
}: {
  label: string;
  varName: string;
  bg: string;
  fg: string;
  note: string;
}) {
  const { theme } = useTheme();
  const tileRef = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");
  const [oklch, setOklch] = useState("");

  useEffect(() => {
    if (!tileRef.current) return;
    const rgb = getComputedStyle(tileRef.current).backgroundColor;
    setHex(rgbStringToHex(rgb));
    setOklch(rgbStringToOklch(rgb));
  }, [theme]);

  return (
    <div className="rounded-md border overflow-hidden">
      <div ref={tileRef} className={`${bg} ${fg} h-16 flex items-end p-2`}>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="p-2 space-y-1">
        <p className="font-mono text-label-sm text-foreground">{varName}</p>
        <p className="font-mono text-label-sm text-muted-foreground">
          {hex} · {oklch}
        </p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function Placeholder({ note }: { note: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        Not yet implemented
      </p>
      <p className="text-xs text-muted-foreground mt-1">{note}</p>
    </div>
  );
}

export const Primitives = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [checked, setChecked] = useState(true);
  const [switchOn, setSwitchOn] = useState(true);
  const [date, setDate] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [dateTimeSecs, setDateTimeSecs] = useState("");
  const [time, setTime] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [country, setCountry] = useState<(typeof COUNTRIES)[number] | null>(
    null,
  );
  const [somePerms, setSomePerms] = useState<string[]>(["read", "write"]);
  const [allPerms, setAllPerms] = useState<string[]>(
    PERMISSIONS.map((p) => p.value),
  );
  const [manyPerms, setManyPerms] = useState<string[]>([
    "read",
    "write",
    "approve",
    "publish",
    "archive",
    "export",
  ]);
  const [chips, setChips] = useState(["Draft", "In review", "Approved"]);

  const handleLoadingDemo = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* No bespoke header bar or DarkModeToggle here — this page now renders
          inside PageLayout (layout: "default"), so the Navbar above already
          supplies site chrome and its own dark-mode toggle. */}
      <PageContentHeader
        title="Primitives"
        subtitle="Live reference for every shadcn-derived primitive and the field-level components composed on top of them — a form control belongs beside the other form controls, which is what this page is for. Page-level composites (PageContentHeader, ConfirmDialog, DataTable, FilterSheet) live in Advanced / Composite."
      />

      <div className="mt-6 flex gap-10">
        {/* In-page section nav */}
        <nav className="hidden md:block w-48 shrink-0">
          {/* top-24 clears the floating navbar's 88px, same as the sections' scroll-mt */}
          <ul className="sticky top-24 space-y-1 text-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block px-3 py-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <main className="flex-1 space-y-12 min-w-0">
          <Section
            id="colors"
            title="Color Palette"
            description="Tonal ramps, semantic roles, and functional colors derived from TC brand seeds."
            bare
          >
            <div className="space-y-4">
              <Subsection label="Primary Scale — Orange (#E34F1C seed)">
                <div className="flex flex-wrap gap-3">
                  {RAMP_STEPS.map((step) => (
                    <div
                      key={step}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className="h-14 w-14 rounded-md border"
                        style={{
                          backgroundColor: `hsl(var(--primary-${step}))`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </Subsection>

              <Subsection label="Neutral Scale — Gray (#515151 seed)">
                <div className="flex flex-wrap gap-3">
                  {RAMP_STEPS.map((step) => (
                    <div
                      key={step}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className="h-14 w-14 rounded-md border"
                        style={{
                          backgroundColor: `hsl(var(--neutral-${step}))`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </Subsection>

              {PALETTE_GROUPS.map((group) => (
                <Subsection key={group} label={group}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SEMANTIC_ROLE_SWATCHES.filter(
                      (c) => c.group === group,
                    ).map((c) => (
                      <Swatch key={c.label} {...c} />
                    ))}
                  </div>
                </Subsection>
              ))}
            </div>
          </Section>

          <Section
            id="typography"
            title="Typography"
            description="DESIGN.md §3's type scale — Poppins for headings/subtitles, Inter for body copy."
          >
            <div className="space-y-3">
              {TYPE_SCALE.map((t) => (
                <div key={t.name} className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">
                    {t.name}
                  </span>
                  <span className={t.className}>The quick brown fox</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="spacing"
            title="Spacing & Grid"
            description="DESIGN.md §5's 4px base-unit scale — box size grows with each step."
          >
            <div className="flex flex-wrap items-end gap-6">
              {SPACE_SCALE.map((s) => (
                <div key={s.name} className="flex flex-col items-center gap-1">
                  <div className={`bg-primary rounded-sm ${s.className}`} />
                  <span className="text-xs text-muted-foreground">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="radius"
            title="Radius"
            description="DESIGN.md §5's four steps. sm/md/lg are tokens in src/theme.css, so a portal can retune all three; rounded-full is pinned. Values below are read from the live computed style, not typed in."
          >
            <div className="space-y-8">
              <div className="flex flex-wrap gap-8">
                {RADIUS_SCALE.map((r) => (
                  <RadiusTile key={r.name} {...r} />
                ))}
              </div>

              <div className="space-y-3 border-t border-card-border pt-6">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  In place
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button>Button · sm</Button>
                  <Input className="w-40" placeholder="Field · sm" />
                  <Badge>Badge · full</Badge>
                  <div className="rounded-md border border-border-dark bg-card px-3 py-2 text-sm">
                    Card · md
                  </div>
                  <div className="rounded-lg border border-border-dark bg-card px-3 py-2 text-sm">
                    Modal · lg
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Button and field share <code>rounded-sm</code> — their corners
                  should match.
                </p>
              </div>
            </div>
          </Section>

          <Section
            id="icons"
            title="Icons"
            description="react-icons (Phosphor) — size-4 default, size-5 for standalone icon buttons (DESIGN.md §4)."
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {ICON_SAMPLES.map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5 rounded-md border p-3"
                >
                  <Icon className="size-5" />
                  <span className="text-xs text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
            <Button
              render={
                <Link
                  to={"https://react-icons.github.io/react-icons/icons/pi/"}
                />
              }
              nativeButton={false}
              variant="link"
            >
              View full icon library
            </Button>
          </Section>

          <Section
            id="buttons"
            title="Buttons"
            description="Five variants × five states. Height 40px, padding 16px, radius 4px — every variant. One primary action per view."
            bare
          >
            <div className="space-y-4">
              <Subsection label="Variants — Default">
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Primary action</Button>
                  <Button variant="secondary">Secondary filled</Button>
                  <Button variant="outline">Secondary outline</Button>
                  <Button variant="tertiary">Tertiary</Button>
                  <Button variant="ghost">Ghost action</Button>
                </div>
              </Subsection>

              <Subsection label="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </Subsection>

              <Subsection label="With Icons">
                <div className="flex flex-wrap gap-3">
                  <Button startIcon={<PiPlus className="size-4" />}>
                    Add record
                  </Button>
                  <Button
                    variant="secondary"
                    startIcon={<PiDownloadSimple className="size-4" />}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    startIcon={<PiFunnel className="size-4" />}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="ghost"
                    startIcon={<PiArrowsClockwise className="size-4" />}
                  >
                    Refresh
                  </Button>
                </div>
              </Subsection>

              <Subsection label="States — loading keeps variant color · disabled uses neutral-600, not opacity dimming">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Loading — spinner replaces icon, variant color unchanged,
                    cursor: default
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button isLoading={isSaving} onClick={handleLoadingDemo}>
                      {isSaving ? "Saving..." : "Click to load"}
                    </Button>
                    <Button variant="secondary" isLoading>
                      Exporting...
                    </Button>
                    <Button variant="outline" isLoading>
                      Loading...
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Disabled filled — neutral-600 background, white text
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Primary</Button>
                    <Button variant="secondary" disabled>
                      Secondary
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Disabled outlined — neutral-600 border + text
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" disabled>
                      Secondary outline
                    </Button>
                    <Button variant="tertiary" disabled>
                      Tertiary
                    </Button>
                    <Button variant="ghost" disabled>
                      Ghost
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground border-t pt-3">
                  Loading: keeps the variant's own fill/stroke — never neutral.
                  Uses cursor: default, not not-allowed. Disabled: neutral-600
                  replaces identity entirely — not dimmed with opacity.
                </p>
              </Subsection>
            </div>
          </Section>

          <Section
            id="inputs"
            title="Inputs"
            description="Input + label, at rest and in an error state."
          >
            <FieldGroup className="max-w-sm">
              <Field>
                <FieldLabel htmlFor="demo-input">Full name</FieldLabel>
                <Input id="demo-input" placeholder="Jane Doe" />
              </Field>
              {/* The reference shape for validation: `data-invalid` on the Field
                  colours the label and message, `aria-invalid` on the control
                  colours its border and announces it. Both are needed — neither
                  covers the other, and the input's old border-destructive class
                  is now redundant. */}
              <Field data-invalid>
                <FieldLabel htmlFor="demo-input-error">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="demo-input-error"
                  defaultValue="not-an-email"
                  aria-invalid
                />
                <FieldError>Enter a valid email address.</FieldError>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            id="selects"
            title="Selects"
            description="Same shape as Input by default — 40px tall, 12px padding, filling its container (DESIGN.md §6 Forms). size and width are named scales; a className still overrides either, which is why they resolve through cn() rather than as data-attribute variants."
          >
            <div className="space-y-6">
              {/* defaultValue matches an item's value exactly. It read "a" until this section
                  was revisited, which silently showed the placeholder instead of Option A —
                  a select whose default never applies looks identical to one with no default. */}
              <CardExample label="Default — sits flush with an Input above it">
                <FieldGroup className="max-w-sm">
                  <Field>
                    <FieldLabel htmlFor="select-vs-input">
                      Reference input
                    </FieldLabel>
                    <Input
                      id="select-vs-input"
                      placeholder="Same height, same padding"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Select</FieldLabel>
                    <Select defaultValue="A">
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                        <SelectItem value="C">Option C</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </CardExample>

              <CardExample label="width — xs 96 · sm 160 · md 224 · lg 320 · full (default)">
                <div className="flex flex-wrap items-center gap-3">
                  {(["xs", "sm", "md", "lg"] as const).map((w) => (
                    <Select key={w}>
                      <SelectTrigger width={w} aria-label={`Width ${w}`}>
                        <SelectValue placeholder={w} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              </CardExample>

              <CardExample label="size — sm 32 · md 36 (the DataTable toolbar height) · default 40">
                <div className="flex flex-wrap items-center gap-3">
                  {(["sm", "md", "default"] as const).map((sz) => (
                    <Select key={sz}>
                      <SelectTrigger
                        size={sz}
                        width="sm"
                        aria-label={`Size ${sz}`}
                      >
                        <SelectValue placeholder={sz} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              </CardExample>
            </div>
          </Section>

          <Section
            id="combobox"
            title="Searchable Select"
            description="A filterable Select — reach for it over Select once the list is long enough that scrolling stops being reasonable. Same width scale as Select, and the same default shape. Composed from Combobox parts at the call site, exactly the way pages compose Select today; the search field sits at the top of the popup, never inline in the trigger."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <CardExample label="Default">
                <Combobox
                  items={COUNTRIES}
                  value={country}
                  onValueChange={setCountry}
                  autoHighlight
                >
                  <div className="space-y-2">
                    <ComboboxFieldLabel>Country</ComboboxFieldLabel>
                    <ComboboxTrigger className="w-full">
                      <ComboboxValue placeholder="Select a country" />
                    </ComboboxTrigger>
                  </div>
                  <ComboboxContent>
                    <ComboboxInput placeholder="Search countries" />
                    <ComboboxEmpty>No countries found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: (typeof COUNTRIES)[number]) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {country?.value ?? "(empty)"}
                </p>
              </CardExample>

              <CardExample label="Disabled">
                <Combobox items={COUNTRIES} disabled>
                  <ComboboxTrigger>
                    <ComboboxValue placeholder="Disabled" />
                  </ComboboxTrigger>
                </Combobox>
              </CardExample>
            </div>
          </Section>

          <Section
            id="multi-select"
            title="Multi-Select"
            description="Chips in the trigger, which stays one fixed height whatever is selected: a single All chip once everything is, and +N more past maxChips (default 3). All and +N more are summaries rather than values, so neither carries a remove control — Clear all in the popup is the unambiguous action. Select all acts on whatever the search has filtered to and names that count."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <CardExample label="Some selected — chips, each removable">
                <MultiSelect
                  label="Permissions"
                  options={PERMISSIONS}
                  value={somePerms}
                  onValueChange={setSomePerms}
                />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {somePerms.join(", ") || "(empty)"}
                </p>
              </CardExample>

              <CardExample label="Everything selected — one All chip">
                <MultiSelect
                  label="Permissions"
                  options={PERMISSIONS}
                  value={allPerms}
                  onValueChange={setAllPerms}
                />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {allPerms.join(", ") || "(empty)"}
                </p>
              </CardExample>

              <CardExample label="maxChips={2} with 6 selected — +4 more">
                <MultiSelect
                  label="Permissions"
                  options={PERMISSIONS}
                  value={manyPerms}
                  onValueChange={setManyPerms}
                  maxChips={2}
                />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {manyPerms.join(", ") || "(empty)"}
                </p>
              </CardExample>

              <CardExample label="Empty option list — placeholder, not All">
                <MultiSelect
                  label="Permissions"
                  options={[]}
                  value={[]}
                  onValueChange={() => {}}
                />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  (empty)
                </p>
              </CardExample>
            </div>
          </Section>

          <Section
            id="textareas"
            title="Text Areas"
            description="Fill uses bg-card, border uses border-border-dark."
          >
            <Textarea
              placeholder="Write a description..."
              className="max-w-sm"
            />
          </Section>

          <Section
            id="checkboxes"
            title="Checkboxes"
            description="Checked, unchecked, and disabled."
          >
            <FieldGroup className="gap-3">
              <Field orientation="horizontal">
                <Checkbox
                  id="cb-checked"
                  checked={checked}
                  onCheckedChange={(v) => setChecked(v === true)}
                />
                <FieldLabel htmlFor="cb-checked">Checkbox</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="cb-disabled" disabled />
                <FieldLabel htmlFor="cb-disabled">Disabled</FieldLabel>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            id="radios"
            title="Radio Buttons"
            description="Always presented as a group, never alone."
          >
            <RadioGroup defaultValue="a">
              <Field orientation="horizontal">
                <RadioGroupItem value="a" id="r-a" />
                <FieldLabel htmlFor="r-a">Option A</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="b" id="r-b" />
                <FieldLabel htmlFor="r-b">Option B</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="c" id="r-c" disabled />
                <FieldLabel htmlFor="r-c">Disabled</FieldLabel>
              </Field>
            </RadioGroup>
          </Section>

          <Section
            id="switches"
            title="Switches"
            description="Takes effect immediately on toggle — no Save step."
          >
            <FieldGroup className="gap-3">
              <Field orientation="horizontal">
                <Switch
                  id="sw-default"
                  checked={switchOn}
                  onCheckedChange={setSwitchOn}
                />
                <FieldLabel htmlFor="sw-default">Switch</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch id="sw-disabled" disabled />
                <FieldLabel htmlFor="sw-disabled">Disabled</FieldLabel>
              </Field>
            </FieldGroup>
          </Section>

          <Section
            id="tags"
            title="Tags / Chips"
            description="Chip — a selected value, rounded-sm per DESIGN.md §5, distinct from Badge's rounded-full status pill. Optional remove control; a chip rendered inside a clickable container (MultiSelect's trigger) has one, and its stopPropagation is what keeps the container from reacting."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <Chip
                    key={chip}
                    removeLabel={`Remove ${chip}`}
                    onRemove={() =>
                      setChips((prev) => prev.filter((c) => c !== chip))
                    }
                  >
                    {chip}
                  </Chip>
                ))}
                {chips.length === 0 && (
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-medium text-primary hover:underline"
                    onClick={() => setChips(["Draft", "In review", "Approved"])}
                  >
                    Reset chips
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip>Read-only (no remove)</Chip>
                <Chip disabled removeLabel="Remove" onRemove={() => {}}>
                  Disabled
                </Chip>
                <Chip removeLabel="Remove the long one" onRemove={() => {}}>
                  A deliberately long label that has to truncate rather than
                  wrap
                </Chip>
              </div>
            </div>
          </Section>

          <Section
            id="badges"
            title="Badges"
            description="DESIGN.md §6 Badges — tinted fill for success/warning/destructive, solid for default/secondary."
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Section>

          <Section
            id="alerts"
            title="Alerts"
            description="DESIGN.md §6 Alerts — neutral surface, coloured icon/text only, no tinted fill."
          >
            <div className="space-y-3 max-w-md">
              <Alert>
                <PiInfo className="h-4 w-4" />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>
                  This is an informational alert. Prose links use Link Blue —{" "}
                  <a href="#colors">see the palette</a>.
                </AlertDescription>
              </Alert>
              <Alert variant="success">
                <PiCheckCircle className="h-4 w-4" />
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>
                  Your changes have been saved successfully.
                </AlertDescription>
              </Alert>
              <Alert variant="warning">
                <PiWarning className="h-4 w-4" />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>
                  This action can't be undone once confirmed.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <PiWarning className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section
            id="toasts"
            title="Toasts"
            description="Custom-rendered via @framework/components/ui/toast — never sonner directly (lint enforces it). The surface is the same in every state; type is carried by the icon, and by red text for errors only (DESIGN.md §6)."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast.success("Vendor saved", {
                    description: "Your changes are live.",
                  })
                }
              >
                Success
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Export queued", {
                    description: "We'll email you when it's ready.",
                  })
                }
              >
                Info
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.warning("Check this", {
                    description: "Two records were skipped.",
                  })
                }
              >
                Warning
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.error("Something went wrong", {
                    description: "Please try again.",
                  })
                }
              >
                Error
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Stays until dismissed", {
                    description:
                      "duration: Infinity with closeButton — the shape App.tsx uses for the Supabase notice.",
                    duration: Infinity,
                    closeButton: true,
                  })
                }
              >
                Persistent
              </Button>
            </div>
          </Section>

          <Section
            id="modals"
            title="Modals"
            description="Actions sit bottom-right, Cancel to their left (DESIGN.md §7). A form may live in a modal or a side sheet — both are valid, the choice is confirmed with the user, and anything opened from a datatable defaults to a side sheet."
          >
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger
                  render={<Button variant="outline">Title only</Button>}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog title</DialogTitle>
                    <DialogDescription>
                      The simplest form: a heading and one line of context, with
                      the close affordance top-right.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger
                  render={<Button variant="outline">Cancel / Save</Button>}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish changes?</DialogTitle>
                    <DialogDescription>
                      The action cluster sits bottom-right with Cancel
                      immediately to its left — the same placement forms and
                      side sheets use (DESIGN.md §7).
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Cancel
                    </DialogClose>
                    <Button>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <GuardedFieldsDialog />

              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="secondary">Delete record</Button>}
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="secondary">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>

          <Section
            id="side-sheet"
            title="Side sheet"
            description={
              <>
                The edit-existing-data container. Square on all four corners,
                unlike a card or a dialog — it is anchored to the viewport edge
                rather than floating. In practice it carries one of two things:
                a form, usually an edit form opened from a datatable row, or a
                set of{" "}
                <Link
                  to="/sample/advanced#filter-sheet"
                  className="text-info underline-offset-4 hover:underline"
                >
                  filters
                </Link>
                . Actions sit bottom-right like every other container (DESIGN.md
                §7), and a form inside one is guarded against accidental
                dismissal.
              </>
            }
          >
            <GuardedEditSheet />
          </Section>

          <Section
            id="tables"
            title="Tables"
            description="Standard data table layout."
          >
            <div className="rounded-md border max-w-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Jane Doe</TableCell>
                    <TableCell>jane@example.com</TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>John Smith</TableCell>
                    <TableCell>john@example.com</TableCell>
                    <TableCell>Member</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Section>

          <Section
            id="pagination"
            title="Pagination"
            description="The real app component, not shadcn's raw primitive."
          >
            <Pagination
              totalItems={42}
              currentPage={page}
              resultsPerPage={perPage}
              onPageChange={setPage}
              onResultsPerPageChange={setPerPage}
            />
          </Section>

          <Section
            id="tabs"
            title="Tabs"
            description="Tabbed content switcher."
          >
            <Tabs defaultValue="account" className="max-w-md">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="text-sm">
                Account content goes here.
              </TabsContent>
              <TabsContent value="settings" className="text-sm">
                Settings content goes here.
              </TabsContent>
            </Tabs>
          </Section>

          <Section
            id="accordions"
            title="Accordions"
            description="Expand/collapse sections."
          >
            <Accordion className="max-w-md">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes, using the design tokens shown above.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          <Section
            id="cards"
            title="Cards"
            description="rounded-md (8px), border only, never a shadow (DESIGN.md §6). Every part, CardAction and CardFooter included — plus the three behaviours card.tsx only switches on when the right child is present."
            bare
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <CardExample label="Header + content">
                <Card>
                  <CardHeader>
                    <CardTitle>Card title</CardTitle>
                    <CardDescription>
                      Border-only surface, no shadow, per DESIGN.md §6.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Card body content goes here.</p>
                  </CardContent>
                </Card>
              </CardExample>

              <CardExample label="CardAction — icon button">
                <Card>
                  <CardHeader>
                    <CardTitle>Vendor summary</CardTitle>
                    <CardDescription>
                      CardHeader switches to two columns by itself when a
                      CardAction is present — no hand-rolled flex row needed.
                    </CardDescription>
                    <CardAction>
                      <Button variant="ghost" size="icon-sm">
                        <PiGear />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p>The action spans both header rows, top-right.</p>
                  </CardContent>
                </Card>
              </CardExample>

              <CardExample label="CardAction — status badge">
                <Card>
                  <CardHeader>
                    <CardTitle>Belmont Logistics</CardTitle>
                    <CardDescription>
                      A CardAction holds anything, not only a button.
                    </CardDescription>
                    <CardAction>
                      <Badge>Active</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p>Carrier · Supplier</p>
                  </CardContent>
                </Card>
              </CardExample>

              <CardExample label="CardFooter — actions, right-aligned">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification settings</CardTitle>
                    <CardDescription>
                      CardFooter has no justify of its own, so actions ask for
                      justify-end (DESIGN.md §7). border-t adds the divider and
                      the top padding together.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Email me when a vendor changes status.</p>
                  </CardContent>
                  <CardFooter className="justify-end gap-2 border-t">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save changes</Button>
                  </CardFooter>
                </Card>
              </CardExample>

              <CardExample label="CardFooter — metadata, no class">
                <Card>
                  <CardHeader>
                    <CardTitle>Q3 export</CardTitle>
                    <CardDescription>
                      Left is the default, which is why this footer stays
                      neutral instead of right-aligning like a dialog&apos;s.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>1,284 rows.</p>
                  </CardContent>
                  <CardFooter>
                    <p className="text-muted-foreground">
                      Generated 12 Aug 2026
                    </p>
                  </CardFooter>
                </Card>
              </CardExample>

              <CardExample label="CardFooter — justify-between">
                <Card>
                  <CardHeader>
                    <CardTitle>Open tickets</CardTitle>
                    <CardDescription>
                      Metadata left, action right — the third footer shape.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>7 unassigned.</p>
                  </CardContent>
                  <CardFooter className="justify-between border-t">
                    <p className="text-muted-foreground">Updated 2m ago</p>
                    <Button variant="link">View all</Button>
                  </CardFooter>
                </Card>
              </CardExample>

              <CardExample label="Media — img as first child">
                <Card>
                  <img
                    src="/placeholder.svg"
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>Media card</CardTitle>
                    <CardDescription>
                      An img first child drops the card top padding and picks up
                      the top radius, with no extra classes.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </CardExample>

              <CardExample label="CardMedia — icon left, chevron right">
                <Link to="/sample/component-library#cards" className="block">
                  <Card>
                    <CardHeader>
                      <CardMedia>
                        <PiLock />
                      </CardMedia>
                      <CardTitle>Acceptable Use Policy</CardTitle>
                      <CardDescription>
                        Appropriate use of company services and company-issued
                        assets.
                      </CardDescription>
                      <CardAction>
                        <PiCaretRight className="size-4 text-muted-foreground" />
                      </CardAction>
                    </CardHeader>
                  </Card>
                </Link>
              </CardExample>

              <CardExample label="CardMedia — no action, no chevron">
                <Card>
                  <CardHeader>
                    <CardMedia>
                      <PiShield />
                    </CardMedia>
                    <CardTitle>Data Retention</CardTitle>
                    <CardDescription>
                      CardHeader picks its own column count from the slots
                      present — auto/1fr here, auto/1fr/auto with an action too.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>The media column spans both header rows.</p>
                  </CardContent>
                </Card>
              </CardExample>

              <CardExample label="Compact — one variable">
                <Card className="[--card-spacing:--spacing(4)]">
                  <CardHeader className="border-b">
                    <CardTitle>Compact card</CardTitle>
                    <CardDescription>
                      --card-spacing drives the card&apos;s pads and gaps, so
                      24px to 16px is one override. border-b divides the header.
                      A bordered footer&apos;s divider spacing is a fixed 16px.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Tighter than its neighbours, same component.</p>
                  </CardContent>
                </Card>
              </CardExample>
            </div>
          </Section>

          <Section
            id="highlight-panel"
            title="Highlighted Panel"
            description="bg-highlight as a surface: a callout inside a card that needs to read as recessed (DESIGN.md §2.3). Fill only — no border, no shadow. Not a status color; use Alerts for success/warning/error."
            bare
          >
            <div className="space-y-4">
              <Subsection label="Leading instructional banner">
                <HighlightPanel>
                  <PiFileText />
                  <HighlightPanelTitle>Generate Report</HighlightPanelTitle>
                  <HighlightPanelDescription>
                    Select parameters to generate a comprehensive report in
                    Excel format.
                  </HighlightPanelDescription>
                </HighlightPanel>
              </Subsection>

              <Subsection label="Without an icon">
                <HighlightPanel>
                  <HighlightPanelTitle>Before you continue</HighlightPanelTitle>
                  <HighlightPanelDescription>
                    Changes apply to every tenant in the selected region.
                  </HighlightPanelDescription>
                </HighlightPanel>
              </Subsection>

              <Subsection label="Arbitrary body content">
                <HighlightPanel>
                  <p className="text-sm text-foreground">
                    Children pass through, so the panel also works as a plain
                    recessed section with no title or description slot.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Contrast against the card separates the surfaces.</li>
                    <li>Anywhere in a form, not only at the top.</li>
                  </ul>
                </HighlightPanel>
              </Subsection>
            </div>
          </Section>

          {/* <Section
            id="upcoming-events"
            title="Upcoming Events"
            description="A composed dashboard widget from the reference."
          >
            <Placeholder note="Composed dashboard pattern — not built as a reusable component yet." />
          </Section> */}

          <Section
            id="navigation"
            title="Navigation"
            description="The app's top bar."
          >
            <Placeholder note="The real Navbar exists (src/app/layout/Navbar.tsx) but is auth/router/Supabase-data-dependent — it can't be safely mounted standalone on a static demo page." />
          </Section>

          <Section
            id="breadcrumbs"
            title="Breadcrumbs"
            description="Hierarchical page location trail."
          >
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sample">
                    Component Library
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumbs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Section>

          <Section
            id="empty-state"
            title="Empty States"
            description="Icon → heading → subtext → optional CTA, no wrapping chrome."
          >
            <div className="border rounded-md">
              <EmptyState
                icon={PiTray}
                title="No results found"
                description="Try adjusting your filters, or add the first record."
                action={
                  <Button size="sm">
                    <PiPlus className="size-4" />
                    Add record
                  </Button>
                }
              />
            </div>
          </Section>

          <Section
            id="loading-states"
            title="Skeleton Loading States"
            description="Skeleton placeholders."
          >
            <div className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Section>

          <Section
            id="error-states"
            title="Error States"
            description="Reuses EmptyState with a destructive-tinted icon — not a distinct component."
          >
            <div className="border rounded-md">
              <EmptyState
                icon={PiWarning}
                iconClassName="text-destructive"
                title="Something went wrong"
                description="We couldn't load this data. Try refreshing the page."
                action={
                  <Button size="sm" variant="outline">
                    Retry
                  </Button>
                }
              />
            </div>
          </Section>

          <Section
            id="date-pickers"
            title="Date Pickers"
            description="The real app component, not a shadcn primitive."
          >
            <DatePicker value={date} onChange={setDate} />
          </Section>

          <Section
            id="date-time-pickers"
            title="Date &amp; Time Pickers"
            description="DatePicker and TimePicker as two fields sharing one value, both composed rather than rebuilt. Always 24-hour, and emits offset-aware ISO so a timestamptz column round-trips without guessing."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <CardExample label="Default — minute precision">
                <DateTimePicker value={dateTime} onChange={setDateTime} />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {dateTime || "(empty)"}
                </p>
              </CardExample>
              <CardExample label="withSeconds">
                <DateTimePicker
                  value={dateTimeSecs}
                  onChange={setDateTimeSecs}
                  withSeconds
                />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {dateTimeSecs || "(empty)"}
                </p>
              </CardExample>

              <CardExample label="TimePicker on its own — always 24-hour">
                <TimePicker value={time} onChange={setTime} />
                <p className="mt-2 font-mono text-label-sm text-muted-foreground">
                  {time || "(empty)"}
                </p>
              </CardExample>
            </div>
          </Section>

          <footer className="border-t pt-6 text-xs text-muted-foreground">
            Source of truth: DESIGN.md (tokens/component spec) and tailwind.md
            (how those tokens map onto this codebase) at the repo root.
          </footer>
        </main>
      </div>
    </div>
  );
};
