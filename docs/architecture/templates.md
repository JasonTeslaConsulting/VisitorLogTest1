# Page templates — the frame layer

`platform/src/templates/` holds **shells**: the frame of a page and the holes content drops into. A shell
owns header placement, card wrapping, and the spacing rhythm between clusters. Page-edge padding
**and max content width** are `PageLayout`'s job, not a shell's (DESIGN.md §7) — a shell never wraps
its content in its own outer padding or sets its own page width; it fills whatever the page allows.
It owns nothing about fields, columns, or data.

The one exception is `single-card` at `width: "narrow"`, which caps itself at `max-w-2xl`. That is a
*readability* constraint (DESIGN.md §3 caps body text at ~70–75 characters), not the app's width, so
it deliberately does **not** track `--container-max`: a form stays ~672px even if the app widens.

This layer exists because those decisions were previously prose in `.claude/skills/*`, re-derived by
hand on every build. Prose is not executable, so every derivation drifted. A shell makes the
convention importable.

## The four tiers

"Layout" is deliberately **not** used for any of these — it already means route chrome
(`layout: "none"` on an `AppRoute`), and reusing the word is how the two get conflated.

| Tier | Where | Owns | Example |
| --- | --- | --- | --- |
| Primitive | `ui/` kebab-case | one control | `button.tsx` |
| Composed component | `ui/` PascalCase | a fragment of a page | `PageContentHeader` |
| **Template (shell)** | `platform/src/templates/` | a page's frame and its holes | `SingleCardTemplate` |
| Content | `pages/`, `components/<PageName>/` | this project's answers | `VendorForm` |

"Shell" and "template" are the same thing seen from two sides: the file in `platform/src/templates/` is the
shell, its registry entry is the template. There is exactly one entry per shell.

```
Pages  →  Templates  →  Composed components  →  Primitives  →  Base UI
```

`PageLayout` is not in this stack. It is app chrome (logo, `Navbar`, `BackToTop`, `<Outlet />`)
applied once at the router level by `withLayout()` in `platform/src/routes/AppRouter.tsx`. A template renders
*inside* that `<Outlet />`. The coupling runs one way only: a registry entry declares which chrome a
page using it should register with (`layout: "none"` for a standalone public form).

Because of that, shells deliberately do **not** set `min-h-screen` or `bg-background` — inside
`PageLayout`, which already sets both plus a navbar, that would force a permanent scrollbar. The
page background comes from `body` in `index.css`.

## Arrangement names everything

**A template is defined by its holes and its props.** Its name therefore describes what it *is* and
never what it is *for*: "Single card", not "Form page".

A designer sample is a photograph of one filled-in instance. It is never 1:1 with a file, and it is
never a template's identity:

```
SingleCardTemplate.tsx        ← frame + holes        (the template)
  ↳ width: "narrow" | "wide"  ← its arrangement prop (a configuration, chosen per page)
      ↳ designer sample       ← one filled instance  (the PNG)
```

Naming anything in this layer by job is the mistake to avoid, and it applies to registry entries
just as much as to shells. There used to be a "Form page" and a "Management / search page" in the
registry; they were one template at two `width` values, and the names implied a structural
difference that did not exist. Those names also quietly forbid the obvious — nothing stops a
detail page from wanting a narrow single card.

Where does the job information go? Into each entry's `commonlyUsedFor`, explicitly labelled as
examples. It is genuinely useful when choosing; it just isn't the template's name.

## Samples are not templates

A **template** is a frame defined by its holes. A **sample** is one filled instance of a frame: a
template at particular options, holding particular components at a particular configuration.
`platform/src/samples/registry.ts` lists them, `/sample/pages` is the gallery, and
`.claude/skills/build-from-sample/SKILL.md` is the procedure for building from one.

The two layers exist for different audiences, which is why their rules differ:

|  | Template | Sample |
| --- | --- | --- |
| Defined by | its holes and arrangement props | a template + options + components + their configuration |
| Named by | the arrangement — "Single card" | **the job — "Approval Page", "Form Page Public"** |
| Chosen by | whoever builds the page | whoever asks for it |
| Registry | `platform/src/templates/registry.ts` | `platform/src/samples/registry.ts` |

**Samples may be named by job, and templates may not.** That reversal is deliberate, and it has to
be written down or it reads as a contradiction of the section above. A template is defined by its
holes, so a job name asserts a structural difference that isn't there — which is exactly why "Form
page" and "Management / search page" were removed from the template registry. A sample *is* one
filled instance, so the job is the most useful thing about it. Someone prompting a build knows their
job; they do not know our holes, and should not have to.

Every sample entry names the `template` and `templateOptions` it composes, so the relationship reads
as *built on* rather than *competing with*.

### A sample's routing is not the routing it teaches

Every sample route is `access: "public"`, `layout: "default"` — otherwise the sample navbar
disappears and an unauthenticated visitor sees nothing. So Form Page Public renders **with** a navbar
while being the sample of a page that has none. Each entry therefore carries `realLayout` and
`realAccess`: what a real copy should register with, as distinct from how the sample itself renders.
The gallery states it on every card, and `build-from-sample` says to route from those fields and
never from the sample's own.

### The admission test — does a page earn a sample entry?

> A page earns an entry when it is a **distinct, nameable configuration someone would ask for by
> name** — a different arrangement, different regions, **or the same regions and components at a
> different repeatable configuration**.
>
> It does **not** earn one when only the content differs: same configuration, different fields.

The middle clause is what separates this from the hole test above. An Approval Page has the same
holes, regions and components as Table Page — only the `DataTable`'s configuration differs. The hole
test would reject it; the admission test accepts it, because "make it like the Approval Page" is an
instruction worth supporting. `variantOf` records the relationship and `configuration` spells out
the delta, so the gallery shows the two as one family rather than two unrelated pages.

Offering a few named configurations is the point: `DataTable` alone takes striped, selection, row
actions, filters and refresh, and asking a prompter to assemble a coherent set from those is asking
them to learn the component.

### Growing the library

Adding a sample means editing `platform/**`, which only the framework's own repo can do
(`framework.role: "source"`). A portal writes `docs/sample-candidates/<name>.md` instead and a
maintainer harvests it — the same hand-off as `CLAUDE.md`'s "Upstream it" rule for any other
framework change. `build-from-sample` has both procedures.

## The hole test — new template, or a new prop value?

> **Do two designs have the same set of holes?** Same holes → the same template, a new value on an
> existing prop. Different holes → a new template.
>
> **Exception:** same holes still justifies a new template when the two arrangements' props cannot
> share a vocabulary. `StackedCardTemplate` has a header plus two content regions, exactly like
> `SplitCardTemplate` — but `aside-left`/`aside-right` is meaningless stacked vertically, and one
> shell whose prop values change meaning per mode is two shells wearing a trench coat.

Worked example. A designer supplies two form pages: one a narrow card with fields and buttons, the
other wider, with the form acting as a search over a large result set.

- Sample A's holes: header, body, actions.
- Sample B's holes: header, filters, **results**, **pagination**.

Same *frame*, different *body composition* — so both are `single-card`, A at `width: "narrow"` and B
at `width: "wide"`. B's body is composed from datatable components, A's from form components.
Neither needs its own template, and neither earns its own registry entry.

Without this test, every new sample becomes a file and near-identical shells drift apart.

## `holes` + `options` — one entry per shell

`platform/src/templates/registry.ts` is **pure data**, and holds exactly one entry per shell. Each entry
names its `holes` and the `options` its arrangement props accept, **first value first — that is the
default**:

```ts
{
  id: "single-card",
  holes: ["header", "children"],
  options: { width: ["narrow", "wide"] },
  shell: "@/templates/SingleCardTemplate",
}
```

`options` is also what the gallery's live props toolbar renders from, so adding an allowed value
puts a working toggle on the preview page with no page edit. Both `holes` and `options` are
deliberately **flat literals** of strings — no JSX, no functions. Anything that cannot be expressed
that way is the hole test telling you it needs a new template, not a cleverer registry.

A page records both halves: `template: single-card` in its build unit's frontmatter, plus
`template_props: { width: wide }`.

The registry stays statically parseable because two scripts read it without running TypeScript:

- `scripts/gen-arch-docs.mjs` lists templates in `docs/architecture/inventory.md`, the file every
  planning skill already reads. That is the discovery mechanism.
- `scripts/docs-check.mjs` (Check 7) verifies every `shell` path exists on disk and every
  `previewRoute` is registered in a `src/routes/modules/*.routes.tsx`. A gallery entry pointing at
  nothing is the failure that would make the registry untrustworthy.

## There is no `actions` hole

DESIGN.md §7 places the primary action bottom-right of forms, side sheets **and** modals alike.
Sheets and modals are not templates, so the action bar is a cross-container concern and belongs in a
composed `ActionBar` inside `children` — not reimplemented in three shells.

It also avoids a real footgun. With an `actions` hole, the fields sit in `children` and the submit
button renders **outside** the `<form>` element, so `type="submit"` silently does nothing unless
every page remembers matching `id`/`form=` attributes.

## The residue rule

Strip the frame from a page kind, and whatever generic part is left is a **composed component**, not
a second shell. Form pages leave `FormBody` (the `<Form>` + `<form onSubmit>` + `ActionBar`
wrapper); detail pages leave `InformationDisplay`.

This is why a "BasicForm" is not a shell: a login page, a settings page and a success page all want
the same narrow card, so the frame cannot be form-specific. Only the residue is.

## Current templates

The generated list with preview routes is in `docs/architecture/inventory.md` § Page templates —
read that rather than this table if you only need to know what exists.

| Template | Shell | Holes | Arrangement prop |
| --- | --- | --- | --- |
| `single-card` | `SingleCardTemplate` | `header`, `children` | `width: "narrow" \| "wide"` |
| `split-card` | `SplitCardTemplate` | `header`, `aside`, `children` | `ratio: "equal" \| "aside-left" \| "aside-right"` |
| `stacked-card` | `StackedCardTemplate` | `header`, `top`, `children` | `ratio: "auto" \| "equal" \| "top-tall" \| "bottom-tall"` |
| `card-grid` | `CardGridTemplate` | `header`, `children` | `cardWidth: "sm" \| "md" \| "lg"` |

`cardWidth` is an enum rather than a free size string for two reasons: Tailwind can only compile
class names it can see at build time, and CLAUDE.md bans the `style={{}}` prop a dynamic value would
otherwise need. Each option uses `minmax(min(<size>,100%),1fr)` — a bare `minmax(24rem,1fr)` forces
a 384px track even in a 343px container, which puts a 375px phone into horizontal scroll.

`stacked-card`'s `ratio` sets **minimum heights**, not `grid-rows-[1fr_2fr]` fractions. Row
fractions only resolve inside a container with a bounded height; on a normal content-driven page
they collapse to the content's own height and the prop appears to do nothing. A minimum is honest —
it sets a floor, and either card still grows past it. `auto` imposes no floor at all, which is the
default because real pages are content-driven.

## Adding one

See `.claude/skills/add-page-template/SKILL.md`. In short: apply the hole test first. Most designs
turn out to be an existing template at a `props` value it already supports, and touch nothing at
all — the next most likely outcome is one new value in an existing entry's `options`, which the
preview toolbar picks up for free.
