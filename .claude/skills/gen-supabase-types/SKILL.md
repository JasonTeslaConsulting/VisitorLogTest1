---
name: gen-supabase-types
description: >
  Use this skill when Supabase types need to be generated or regenerated, or when a
  schema has to be added to the generated set. Triggers: "regenerate supabase types",
  "update the types file", "the types are outdated", "I added a new table",
  "gen types", "types.ts is missing X", "add a schema", "the new schema isn't in
  types", "table X isn't found". Also triggered automatically by call-api skill when
  types.ts is missing or a table cannot be found in it.
applies_to:
  - supabase types
  - database schema
  - type generation
  - new tables
  - new schemas
---

# Skill: Generate Supabase Types

## What this does

Runs the Supabase CLI to generate TypeScript types from this portal's database into
`src/integrations/supabase/types.ts`. That file is the source of truth for every column
name, type and nullability in the app — services derive their `RawX` types from it.

---

## Step 1 — Understand where the schema list comes from

**It is not in the npm script.** The script is only a thin entry point:

```json
"gen-supabase-types": "node platform/scripts/gen-supabase-types.mjs --project-id <ref>"
```

The list is assembled from two declared sources, split by owner:

| Source | Contains | Owner |
| --- | --- | --- |
| `platform/framework.json` → `requiredSchemas.schemas` | `public`, `_arch`, `_secure` | **framework** — read-only in a portal |
| `package.json` → `supabase.schemas` | this portal's own schemas | **app** — yours to edit |

The split exists because the two halves fail in opposite directions. Dropping a framework
schema strips its tables from the shared `Database` type and silently untypes all six
framework services — so a portal must not be able to. Adding this portal's own schemas has
to be trivial for someone who does not know the CLI — so it is one array.

To see the resolved list without generating anything:

```bash
npm run gen-supabase-types -- --dry-run
```

---

## Step 2 — Adding a schema

When a table cannot be found in `types.ts`, work out which schema it lives in, then:

1. Add the schema name to `package.json`'s `supabase.schemas` array. Nothing else.
2. Re-run `npm run gen-supabase-types`.
3. Confirm the table now appears (Step 4).

```json
"supabase": { "schemas": ["_billing"] }
```

**Ask the developer before adding one** — a schema name is a claim about the database, and
guessing wrong produces a confusing CLI failure. Say which table you are looking for and
which schema you believe it is in, and let them confirm. Duplicates are harmless: the script
dedupes, so re-listing `_arch` changes nothing.

**Never add a framework schema here.** `public`, `_arch` and `_secure` are already included
on every run. Listing them again is redundant, and if one of them seems to be missing from
the output, that is a database problem — not a list problem (see Step 3).

---

## Step 3 — Run it

```bash
npm run gen-supabase-types
```

The script fails *before* writing, so a failed run always leaves the existing `types.ts`
untouched. Its errors are already actionable — read them rather than guessing:

| Error | Meaning |
| --- | --- |
| `the project ref is still [SUPABASE-PROJECT-ID]` | The ref was never set. It is the first label of the Supabase URL: `https://<ref>.supabase.co`, the same value in `public/config/app.json`. |
| `Schema "X" does not exist` and X is **yours** | Remove it from `package.json`'s `supabase.schemas` — this database does not have it. |
| `Schema "X" does not exist` and X is a **framework** schema | The database was not set up from the baseline schema. This is not fixable by editing lists — tell the developer. |
| `The CLI is not authenticated` | Run `supabase login`, or set `SUPABASE_ACCESS_TOKEN`. One-time per machine. |
| `the generated types are missing _arch:, _secure:` | The generation succeeded but produced a file that would fail `framework:verify`. Do not work around this; report it. |

---

## Step 4 — Verify the output

```bash
grep -c "" src/integrations/supabase/types.ts
grep -n "organizationuser\|<the table you needed>" src/integrations/supabase/types.ts | head
```

Then run `npm run framework:verify` — it re-checks the same `_arch:` / `_secure:` markers the
script checked, and is the gate CI runs.

---

## Step 5 — Report what changed

Briefly, to the developer:

- line count of the generated file
- the full schema list used (framework + this portal's)
- confirmation that the specific table needed for the current task is present

> Types generated (1,847 lines). Schemas: public, \_arch, \_secure, \_billing.
> `billing_invoice` is present with 11 columns.

**Commit `types.ts`.** It is generated but tracked — the build and every service depend on it,
and `framework:verify` asserts it exists.

---

## How types.ts is used

```ts
export type Database = {
  public: { Tables: { guest_visits: { Row: { id: string /* … */ }; Insert: {}; Update: {} } } };
  _secure: { Tables: { organizationuser: { Row: {} } } };
};
```

Service functions build their `RawX` types from
`Database["schema"]["Tables"]["tablename"]["Row"]`, which is what keeps column names exactly
right. See `.claude/rules/service-rules.md`.

---

## Rules

- Never edit `src/integrations/supabase/types.ts` by hand — it is always generated
- Never commit it with placeholder or dummy values
- Regenerate whenever a table or column is added to the database
- Add a schema only to `package.json`'s `supabase.schemas`, and only after the developer confirms
- Never edit `platform/framework.json` to change the required schemas — it is framework-owned,
  `framework:verify` rejects the edit in a portal, and the framework's services depend on it
