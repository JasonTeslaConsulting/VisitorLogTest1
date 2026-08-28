# Sample candidates

A page shape this portal needed that the framework's sample library doesn't have yet.

## Why this directory exists

`platform/**` is read-only in a portal — `npm run framework:verify` rejects the edit and
`.claude/hooks/guard-framework.mjs` blocks the write. So when a page is built here that would be
worth reusing, it **cannot** be added to `platform/src/samples/registry.ts` from this repo. Writing a
candidate here is the hand-off instead.

This is the same rule as `CLAUDE.md`'s "Upstream it": a portal never forks the framework, because a
local fork survives every future `framework:update` merge and silently becomes permanent. It records
what it needed and hands it over.

## When to write one

Only when the page passes the admission test in `.claude/skills/build-from-sample/SKILL.md`:

> A page earns a sample entry when it is a distinct, nameable configuration someone would ask for by
> name — a different arrangement, different regions, or the same regions and components at a
> different repeatable configuration. It does **not** earn one when only the content differs.

A page that is an existing sample holding different fields is not a candidate. Most pages aren't.

## What to write

One file per candidate, `<name>.md`:

- **Name** — `<Thing> Page`, the phrase someone would type. Job names are fine here.
- **What distinguishes it** — one line, versus the nearest existing sample.
- **Template and options** it composes, and its regions in order.
- **Component configuration** that defines it, if that is what makes it distinct.
- **`realLayout` / `realAccess`** a page using it needs.
- **Where it lives in this portal**, so a maintainer can read the real thing.
- **Why no existing sample fit** — the most useful part, and the easiest to skip.

## What happens next

Nothing automatic. Portals and the framework are separate repos and no tooling spans them. A
framework maintainer reads candidates when they choose, implements the sample in the framework repo,
and republishes; the portal picks it up on the next `npm run framework:update`.

Until then the page is a one-off here, which is fine — it works, it just isn't reusable elsewhere yet.
