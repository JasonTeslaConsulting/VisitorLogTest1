---
name: add-page-template
description: >
  Use this skill when adding a new page arrangement to the template gallery, or
  when a designer supplies a new page sample. Triggers: "add a page template", "the
  designer sent a new layout", "we need another form layout", "add this to the
  template gallery". Decides whether the sample is an existing template at a prop
  value (usually), one new value on an existing prop (sometimes), or a new template
  and shell (rarely), then wires it end to end.
applies_to:
  - platform/src/templates/
  - page templates
  - template gallery
  - designer samples
---

# Skill: Add a Page Template

Read this entire file before writing any code. Background and rationale live in
`docs/architecture/templates.md` — this file is the procedure.

## Step 0 — Apply the hole test first

**Most designer samples need no new code at all.** Before creating anything, answer one question:

> **Does this design have the same set of holes as an existing template?**
> Same holes, and an existing prop value fits → **nothing to add**; the page just uses it.
> Same holes, no value fits → **one more value** on that prop's enum (Step 1 only).
> Different holes → a **new template and shell** (Steps 1–2).
>
> **Exception:** same holes still justifies a new template when the two arrangements' props cannot
> share a vocabulary — `stacked-card` exists alongside `split-card` because `aside-left`/
> `aside-right` is meaningless stacked vertically.

A "hole" is a slot content drops into, not a visual difference. A narrow card and a wide card have
the same holes — header and body — so they are one template with a `width` prop, not two. A page
that adds a *results region* and a *pagination footer* has different holes.

Current templates and their holes:

| Template | Shell | Holes | Arrangement prop |
| --- | --- | --- | --- |
| `single-card` | `SingleCardTemplate` | `header`, `children` | `width: "narrow" \| "wide"` |
| `split-card` | `SplitCardTemplate` | `header`, `aside`, `children` | `ratio: "equal" \| "aside-left" \| "aside-right"` |
| `stacked-card` | `StackedCardTemplate` | `header`, `top`, `children` | `ratio: "auto" \| "equal" \| "top-tall" \| "bottom-tall"` |
| `card-grid` | `CardGridTemplate` | `header`, `children` | `cardWidth: "sm" \| "md" \| "lg"` |

**When in doubt, prefer the prop value.** Two shells rendering nearly identical frames is the exact
duplication this layer exists to prevent — a padding fix then has to be made twice, and one copy
gets missed.

---

## Step 1 — Add or extend the registry entry

There is **exactly one entry per shell**. Adding a value to an existing arrangement means editing
that shell's `options` array; adding a new shell means appending a whole entry. **Append — never
reorder** the array; alphabetising a shared file turns a small conflict into a whole-file one for
everyone else in flight (CLAUDE.md).

```ts
{
  id: "stacked-card",              // kebab-case, stable — build units store this in `template:`
  name: "Stacked cards",           // the ARRANGEMENT, never the job
  description:
    "Two cards, one above the other, at the same width as a wide single card. `ratio` sets a minimum height for each.",
  holes: ["header", "top", "children"],
  options: { ratio: ["auto", "equal", "top-tall", "bottom-tall"] },  // first value is the default
  commonlyUsedFor: ["A summary or filter card above a results card"],
  shell: "@framework/templates/StackedCardTemplate",
  layout: "default",               // which PageLayout chrome a page using this registers with
  previewRoute: "/sample/templates/stacked-card",
}
```

Rules for each field:

- **`name`** — the arrangement ("Stacked cards"), **never** the job ("Dashboard", "Form page"). A
  template is defined by its holes and props; a job name implies a structural difference that isn't
  there, and quietly forbids the obvious — nothing stops a detail page wanting a narrow single card.
- **`description`** — what the arrangement *is* and what its props vary. Not what it's for.
- **`holes`** — every slot content drops into, in render order. `children` is always one of them.
- **`options`** — each arrangement prop's allowed values, **first value first: it is the default**.
  Flat literals of strings only. **No JSX, no functions.** If the configuration cannot be expressed
  this way, the hole test was wrong and it needs its own shell. The gallery's props toolbar renders
  straight off this, so a new value gets a working toggle for free.
- **`commonlyUsedFor`** — where the job information lives, as clearly-labelled examples. Non-binding.
- **`previewRoute`** — `/sample/templates/<id>`. `npm run docs:check` warns if it isn't registered.

---

## Step 2 — Add the shell (only if the hole test said so)

`platform/src/templates/<Arrangement>Template.tsx`, PascalCase, named export, no `export default`.

```tsx
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { TemplateProps } from "@framework/types/templates";

type MyTemplateProps = TemplateProps & { arrangement?: "a" | "b" };

export const MyTemplate = ({ title, subtitle, headerActions, children, className }: MyTemplateProps) => (
  <div className={cn(className)}>
    <PageContentHeader title={title} subtitle={subtitle}>{headerActions}</PageContentHeader>
    <div className="mt-6">{children}</div>
  </div>
);
```

No outer padding wrapper and **no max width** — both are `PageLayout`'s job, applied once at the
route level (DESIGN.md §7), never a shell's. The root needs no `mx-auto w-full` either: it is a
block element inside an already-centred, already-capped parent, so both are no-ops. A shell
**owns**: header placement, card wrapping, and the spacing rhythm between clusters.

A shell may set a *narrower* width than the page when that is an arrangement decision —
`single-card` at `width: "narrow"` uses `mx-auto max-w-2xl` for readability (DESIGN.md §3). Such a
width must never be `--container-max`; if it should track the app's width, it shouldn't be set here
at all.

A shell **never**:

- fetches data, or imports a hook, a service, or `@tanstack/react-query` (ESLint enforces the last
  one for `platform/src/templates/**`)
- imports Base UI directly — only through `platform/src/components/ui/`
- sets `min-h-screen` or `bg-background` — inside `PageLayout`, which already sets both plus a
  navbar, that forces a permanent scrollbar. `body` supplies the page background.
- wraps its content in its own outer edge padding — `PageLayout`'s `<main>` already applies it once
  for every page (DESIGN.md §7); a shell only owns spacing *within* its own frame
- has an `actions` hole — the bottom action bar is a cross-container concern (`ActionBar`), and an
  `actions` hole would render the submit button outside the `<form>`, silently breaking
  `type="submit"`. See `docs/architecture/templates.md`.
- knows what a field or a column is

**Arrangement props must be enums, not free values.** Tailwind only compiles class names it can see
at build time, and CLAUDE.md bans the `style={{}}` prop a dynamic value would need. Map the enum to
static classes in a `const` above the component.

**Any grid track must use `minmax(min(<size>,100%),1fr)`.** A bare `minmax(24rem,1fr)` forces a
384px track inside a 343px container and puts a 375px phone into horizontal scroll.

---

## Step 3 — Add the preview page (new shells only)

`platform/src/samples/templates/<Name>.tsx` — one per template, so a new prop value needs no page edit
at all; the toolbar picks it up from `options`.

Fill every hole with `PlaceholderRegion` (`platform/src/components/TemplatePreview/`), not realistic content:
the preview shows the **frame**, and anything that looks like a design gets mistaken for one. The
realistic pages live under `/sample/form-page-public`, `/sample/standard-management-page` and friends.

```tsx
const ENTRY = TEMPLATES.find((t) => t.id === "stacked-card")!;

export const StackedCard = () => {
  const config = useTemplateConfig(ENTRY);          // reads the prop from ?ratio=…
  const ratio = config.ratio as "auto" | "equal" | "top-tall" | "bottom-tall";

  return (
    <>
      <TemplateControls entry={ENTRY} className="mb-6" />
      <StackedCardTemplate title={ENTRY.name} subtitle={`… ratio=${ratio}`} ratio={ratio} …>
```

`TemplateControls` renders above the shell, never in one of its holes — it is gallery chrome, not
part of the template, and `SampleControls` gives it the red "not the real thing" treatment.

**Inline mock data only. Never Supabase, never a hook.** Previews must render on a fresh clone with
no `.env`. Do not use `src/services/fixtures/` — that is for `data_mode: mock` app services
(`.claude/rules/service-rules.md`), not previews.

---

## Step 4 — Register the route

Append to `platform/src/routes/modules/samples.routes.tsx`:

```tsx
{
  path: "/sample/templates/<id>",   // must equal the entry's previewRoute
  element: <MyPreview />,
  access: "public",
  layout: "default",
}
```

---

## Step 5 — Regenerate and verify

```bash
npm run docs:arch && npm run docs:check && npm run typecheck && npm run lint
```

`docs:check` Check 7 warns if any entry's `shell` file is missing or its `previewRoute` isn't
registered. It is **warning-only and always exits 0** — read the output, don't trust the exit code.

Then look at it, at both sizes:

1. `preview_start {name:"dev"}` → `http://localhost:8080/sample/templates`
2. The new card appears with its props and "Commonly used for" list, and its "Open live preview"
   button opens the preview.
3. On the preview, **switch every value of every prop** and confirm the frame actually changes, the
   URL updates (`?ratio=top-tall`), and reloading that URL restores the same configuration. A prop
   whose values render identically means the enum→class map didn't take.
4. `resize_window {preset:"mobile"}` — confirm `document.body.scrollWidth === clientWidth`. A grid
   or split shell that overflows here is the most common defect.
4. `resize_window {colorScheme:"dark"}` — nothing illegible. The theme is class-driven, so flip it
   with `localStorage.setItem('vite-ui-theme','dark')` and reload; `prefers-color-scheme` alone
   won't do it.

---

## What NOT to do

- Do not create a shell per designer sample — apply the hole test first
- Do not name a shell **or an entry** after a page kind (`FormPageTemplate`, "Form page") — both are
  named after the arrangement. Job information goes in `commonlyUsedFor`
- Do not add a second entry for the same shell — one entry per shell; configurations are `options`
  values, not entries
- Do not reorder the `TEMPLATES` array
- Do not put JSX or a function in `options`
- Do not add an `actions` hole
- Do not fetch data in a template or a preview
- Do not use `export default`
