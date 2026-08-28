---
name: add-types
description: >
  Use this skill when adding new TypeScript types to the project.
  Triggers: "add a type for X", "create types for X", "what type should I use",
  "add the payload type", "define the interface for X".
  Always used alongside call-api and build-form-page when creating new
  service functions or form payloads that need type definitions.
applies_to:
  - TypeScript types
  - type definitions
  - src/types/
  - payload types
  - domain types
---

# Skill: Add Types

Read this entire file before writing any code.

## What this skill covers

Adding new TypeScript types to the project.

---

## The one rule

Clean types live in `src/types/<domain>.ts` — one file per domain (`auth.ts`, `roles.ts`,
`users.ts`, ...). `src/types/index.ts` is a compat barrel (`export * from "./<domain>"`, one
alphabetical line per domain) — it exists so existing `@/types` imports keep working. New imports
go straight to the domain file (`import type { OrgUser } from "@framework/types/users"`); add a domain's
line to the barrel only if something outside the domain needs it. No exceptions except RawX types.

---

## RawX types — the only exception

Raw DB types that mirror Supabase column names (all-lowercase) stay inside the service file and are never exported. They are implementation details of the service layer.

```ts
// platform/src/services/users.ts

// ✅ Stays here, never exported
type RawUser = {
  applicationuserid: number;
  fullname: string;
  primaryemail: string;
  createddate: string;
};

// ✅ Clean type goes in platform/src/types/users.ts
export async function getUsers(): Promise<User[]> { ... }
```

---

## How to add types

One file per domain — the filename is the header, so there's no `// --- Domain ---` comment
convention to keep in sync. Adding a new type to an existing domain means opening that one file;
adding a genuinely new domain means creating a new file and adding one line to the barrel.

```ts
// platform/src/types/users.ts
export type User = {
  id: number;
  fullName: string;
  email: string;
  organizationName: string;
  status: "active" | "inactive";
  roles: string[];
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  organizationId: number;
};
```

```ts
// src/types/index.ts — alphabetical, one line per domain, nothing else
export * from "./auth";
export * from "./organization";
export * from "./users";
```

A domain file may import from another domain file (e.g. `users.ts` importing `Role` from
`roles.ts`) — that's normal and expected, not a layering violation.

---

## Naming conventions

- Types and interfaces → PascalCase (`User`, `NavModule`)
- Payload/input types → suffix with `Payload` or `Input` (`CreateUserPayload`)
- Response types → suffix with `Response` if wrapping an API response shape
- Enum-like string unions → inline in the type, not a separate enum

```ts
// ✅ Inline union
status: "active" | "inactive" | "pending";

// ❌ Avoid TypeScript enums
enum Status {
  Active,
  Inactive,
}
```

---

## What NOT to do

- Do not put clean types anywhere outside `src/types/` (a new domain there is fine — see above)
- Do not export RawX types from service files
- Do not use `any` — use `unknown` if the type is genuinely unknown
- Do not define types inside component files, hooks, or pages
- Do not use TypeScript `enum` — use string union types instead
