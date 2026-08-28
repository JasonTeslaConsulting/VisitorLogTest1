---
name: build-from-sample
description: >
  Use this skill whenever a request points at a sample page by name. Triggers:
  "make this page like Form Page Internal", "same layout as Table Page", "build it
  like the sample", "like that sample page but with different fields". Also use it
  when no sample matches and you need to decide what to build from instead, and
  when a page you just built might be worth adding to the sample library.
applies_to:
  - platform/src/samples/
  - sample pages
  - "build it like <sample>"
  - page layout decisions
---

# Skill: Build from a sample

Read this whole file before writing code. `platform/src/samples/registry.ts` is the list of samples;
`docs/architecture/templates.md` § Samples are not templates is the background.

## What a sample is

A **named, filled composition**: a template at particular options, holding particular components at a
particular configuration. Templates are the mechanism, samples are the vocabulary. The person
prompting says "make it like the Approval Page" — they are not required to know what a template is,
and you should not make them learn.

A sample reference is **binding**. If someone names one, reproduce it. This is the opposite of the
usual "use your judgement": they have already exercised judgement by pointing at a page.

## When a sample is named

1. **Find the entry** in `SAMPLES` by `name` — match loosely, "the public form page" means
   `Form Page Public`. If two could match, ask; don't guess between siblings, since siblings are
   precisely the ones that differ in ways that matter.
2. **Open the sample's file** at the entry's `route` → the component in
   `platform/src/samples/samples/`. Read it. The registry says what it is; the file is what it is.
3. **Reuse**: the entry's `template` and `templateOptions`, its `regions` in order, its component
   choices, its action placement, its spacing rhythm.
4. **Route the new page with `realLayout` and `realAccess`, never the sample's own.** Every sample
   route is `layout: "default"`, `access: "public"` so the sample navbar survives and an
   unauthenticated visitor can browse. Copying the sample's routing gives a public page that should
   have been signed-in, or a navbar on a page designed without one. This is the single most likely
   thing to get silently wrong.
5. **Copy the shape, never the content.** Field names, labels, mock data and copy belong to the new
   page. A vendor form is the sample; a leave request is what you are building.

### What the sample does *not* govern

The sample governs **layout and composition**. The unit spec, or what the user asked for, governs
**content, fields, validation and behaviour**. These are not in competition. Where they look like
they are — the sample has three regions and the spec describes four — say so and ask rather than
silently dropping one.

### The conflict rule

Current rules and lint govern **vocabulary**, always. A page built from a sample must pass
`npm run lint` unchanged.

If a sample contradicts a rule in `.claude/rules/` or `DESIGN.md`, **the sample is stale**. Build to
the rule, and say plainly that the sample needs updating. Never propagate a stale pattern because a
sample still shows it — that is how a fixed problem comes back one page at a time.

## When no sample matches

Most requests will not have an exact sample. That is normal, not a failure. Work down this ladder and
**say which rung you are on**:

1. **A named sample** — follow it, as above.
2. **The nearest sample by arrangement**, not by job. State the derivation out loud: *"deriving from
   Table Page, swapping the filter row for a date range."* Someone saying "do it like this page" is
   asking for house style; the nearest sample carries it even when the job is different.
3. **Template + components** — `platform/src/templates/registry.ts` plus
   `.claude/skills/build-custom-ui/SKILL.md`. The normal path for a genuinely new page shape.
4. **Custom UI** — last resort, with that skill's screenshot step.

Never invent a layout while a sample sits one rung up. Never claim a sample exists that doesn't.

## Adding to the library

### The admission test

> A page earns a sample entry when it is a **distinct, nameable configuration someone would ask for
> by name** — a different arrangement, different regions, **or the same regions and components at a
> different repeatable configuration**.
>
> It does **not** earn one when only the content differs: same configuration, different fields,
> labels or data.

The middle clause is the one that matters. An Approval Page has the same holes, regions and
components as Table Page — only the `DataTable`'s configuration differs (row selection on, Approve /
Reject bulk actions). A purely structural test would reject it, yet "make it like the Approval Page"
is exactly the instruction to support. Record the relationship with `variantOf` and spell out the
delta in `configuration`.

Offering named sets is the point. `DataTable` alone takes striped, selection, row actions, filters
and refresh; asking a prompter to assemble a coherent set from those is asking them to learn the
component. A small number of named presets moves that decision to people who know it.

Without the second clause, every page anyone builds becomes a "sample" and the gallery stops meaning
anything — the failure the template registry already had once, when "Form page" and "Management /
search page" were two entries for one template at two `width` values.

### Where you can actually add one — check `framework.role` first

`package.json`'s `framework.role` decides this, and getting it wrong wastes a blocked write:

**`role: "source"`** (the framework's own repo or the template) — add it directly:

1. A page component in `platform/src/samples/samples/<Name>.tsx`.
2. A route in `platform/src/routes/modules/samples.routes.tsx` — `access: "public"`,
   `layout: "default"`, like every other sample, whatever the real page needs.
3. An entry in `platform/src/samples/registry.ts`, including `realLayout` / `realAccess` for a real
   copy, and `variantOf` / `configuration` if it varies an existing sample.
4. `npm run docs:check` — it verifies the route is registered and the template resolves.

The gallery needs no edit; it is registry-driven.

**`role: "consumer"`** (a portal) — you **cannot**. `platform/**` is read-only: `framework:verify`
rejects the edit and `.claude/hooks/guard-framework.mjs` blocks the write. Do not try. Instead:

1. Write `docs/sample-candidates/<name>.md` — the composition, the template and options, the
   component configuration, the regions, and why it did not fit an existing sample.
2. Tell the user plainly that a framework maintainer has to harvest it, and that until they do the
   page is a one-off in this portal.

This is the same shape as `CLAUDE.md`'s "Upstream it" rule for framework changes: a portal never
forks the framework, it records and hands off. Harvesting is manual — portals and the framework are
separate repos and nothing spans them.

### Naming a new sample

`<Thing> Page`, qualified only once a sibling exists — `Table Page` today, `Table Page Compact` and
`Table Page Standard` if a variant ever arrives. Never numbered: "Table Page 1" carries no
information at the moment someone has to recall which is which, and the name is what gets typed
into a prompt.

**Samples may be named by job** — `Approval Page`, `Form Page Public`. This is the exact opposite of
the rule for templates, which are named by arrangement and never by job. The rules differ because
the things differ: a template is defined by its holes, so a job name asserts a structural difference
that isn't there; a sample *is* one filled instance, so the job is the most useful thing about it.
Do not "correct" a sample's job name into an arrangement name.

## What NOT to do

- Don't route a copy with the sample's own `layout`/`access` — use `realLayout`/`realAccess`.
- Don't reproduce a sample's mock data, field names or copy in a real page.
- Don't propagate a pattern that current lint or rules reject, even if the sample still shows it.
- Don't add a sample entry for a page that is an existing sample with different fields.
- Don't attempt to edit `platform/**` in a portal — record a candidate instead.
- Don't tell a user to pick a template. They asked for a page like another page.
