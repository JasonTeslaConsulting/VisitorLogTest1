---
name: plan-debug
description: >
  Use this skill when investigating a bug, error, or unexpected behaviour
  before making any fixes. Triggers: "something is broken", "I'm getting
  an error", "this isn't working", "fix this bug", "why is X not working".
  This skill runs in plan mode — no files are written until the user approves.
applies_to:
  - plan mode
  - debugging
  - error investigation
  - unexpected behaviour
---

# Skill: Debug and Plan a Fix

This skill runs in **plan mode only**. Do not write any files or suggest fixes
until the full investigation is complete and a diagnosis is confirmed.

The most expensive debugging mistake is fixing the wrong thing.
Investigate first, propose second, fix only after approval.

---

## Step 1 — Gather information from the user

Before reading any files, ask the user for:

1. **What is the symptom?**
   - Exact error message (copy-paste, not paraphrased)
   - Where does it appear? (browser console, terminal, toast, blank screen, network tab)
   - What is the URL / page / component where it happens?

2. **When does it happen?**
   - Always, or only under certain conditions?
   - Did it ever work? If yes, what changed recently?
   - Does it happen for all users or specific ones?

3. **What has already been tried?**
   - Any fixes attempted? What happened?

Do not start investigating until you have at least the error message and location.

---

## Step 2 — Investigate (read only, no changes)

Based on the symptom, trace the call chain from the surface down:

**For UI/rendering errors:**

1. Read the component where the error appears
2. Read any hooks it calls
3. Read any services those hooks call
4. Check the type definitions involved

**For data/API errors:**

1. Read the service function making the call
2. Check the Supabase query — table name, column names, filters
3. Check the raw DB type (RawX) vs the mapped type
4. Check if RLS could be blocking the query
5. Check the hook's `enabled` condition — is it firing when it shouldn't?

**For auth/routing errors:**

1. Read `AuthContext.tsx` and `ProtectedRoute.tsx`
2. Check `src/routes/modules/` for the affected route
3. Check `resolveCurrentUser` in `authService.ts`

**For state/context errors:**

1. Trace where the state is set and where it's read
2. Check if the component is inside the correct provider
3. Check for stale closures in `useCallback` / `useEffect`

Use subagents if the investigation spans many files:

```
Use subagents to trace how [data/auth/state] flows from [source] to [symptom location]
```

---

## Step 3 — Identify the root cause

State the diagnosis clearly:

```
## Diagnosis

**Symptom:** [what the user sees]
**Root cause:** [the actual problem, specific file and line if possible]
**Why it happens:** [explanation in plain terms]
**Not the cause:** [rule out anything that might look related but isn't]
```

If the root cause is unclear after investigation, say so explicitly and list
what additional information is needed. Do not guess.

---

## Step 4 — Propose the fix

Only after diagnosis is confirmed, propose the fix:

```
## Proposed Fix

**Files to change:**
- src/[file].tsx — [what changes and why]
- src/[file].ts — [what changes and why]

**Files NOT to change:**
- [list anything that looks related but should not be touched]

**The change:**
[Describe the exact change in plain terms before writing any code]

**Risk:**
[Any side effects or things to verify after the fix]

**How to verify it's fixed:**
[Specific steps to confirm the bug is resolved]
```

---

## Step 5 — Wait for approval

Stop after presenting the diagnosis and proposed fix.
Ask: "Does this diagnosis look right? Should I go ahead with the fix?"

Only implement after explicit approval.

---

## Rules

- Never write files in plan mode
- Never propose a fix before completing the investigation
- If the error message contains a line number, read that exact location first
- If the bug involves Supabase, always check both the service layer AND the RLS policies
- If the bug involves auth, always check `getUser()` vs `getSession()` — never trust session.user
- A missing `enabled` condition on `useQuery` is a common cause of premature API calls
- A module-level variable reading from `appConfig` before initialization is a common timing bug
- Do not fix unrelated issues noticed during investigation — note them separately
- If the fix touches more than 3 files, question whether the root cause is correctly identified

## What to ask vs what to decide

**Decide yourself (do not ask):**

- Any implementation detail covered by CLAUDE.md or a skill file
- File locations, naming, export style, component structure
- Which shared components to use (Pagination, SearchBar, etc.)
- staleTime values, query key structure, hook patterns
- Styling decisions covered by DESIGN.md, and layout/dimension/container conventions (button
  sizing, container types, spacing scale, composition patterns) — these are fixed skeleton
  behavior baked into the shared components and other build skills, not a per-page choice

**Ask the user (product decisions only):**

- Page content: what data, what columns, what actions
- Access control: which roles, which route path
- Business rules: what happens on submit, what triggers what
- UX choices with no clear skeleton default

**Recommend and confirm (one yes/no, not a discussion):**

- Layout choices not covered by skills: "I'd suggest tabs — OK?"
- Default values: "I'll use the skeleton default of 25 rows — OK?"
- Ambiguous requirements: "I'll treat this as optional — OK?"

This skill uses the **planner budget** (3-5 questions) — see `.claude/rules/clarifying-questions.md`.
If you have more than 5 questions, the scope is too large — suggest splitting the task first.
