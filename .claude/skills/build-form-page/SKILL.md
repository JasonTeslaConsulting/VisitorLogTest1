---
name: build-form-page
description: >
  Use this skill when building a page, dialog, or sheet that submits data —
  create, edit, or delete operations. Triggers: "build a create X form",
  "edit X page", "form for adding X", "delete confirmation for X", "dialog
  to update X". Always pair with add-new-route skill and call-api skill when
  building a new form page from scratch.
applies_to:
  - form pages
  - create/edit dialogs
  - validation
  - mutations
---

# Skill: Build a Form Page

Read this entire file before writing any code.

## What this skill covers

Building a page or dialog that submits data — create, edit, or delete operations.

---

## File checklist

- [ ] `src/services/<domain>.ts` — add create/update/delete functions
- [ ] `src/hooks/<domain>/use<Entity>Mutations.ts` — useMutation wrappers
- [ ] `src/components/<PageName>/<PageName>Form.tsx` — form UI and validation
- [ ] Update `src/types/<domain>.ts` with any new types needed
- [ ] If the form renders inside a `Dialog` or `Sheet`: call `useUnsavedChangesGuard` and render
      `UnsavedChangesDialog` — see "Guarding unsaved changes" below. `local/require-unsaved-guard`
      fails the build without it

---

## Validation

Use `react-hook-form` + `zod` for all forms.

```ts
// Define schema with zod
const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

// Use in component
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { fullName: "", email: "", status: "active" },
});
```

---

## Mutation pattern

```ts
// platform/src/services/users.ts
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data, error } = await supabase
    .from("...")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapUser(data as RawUser);
}

// src/hooks/users/useUserMutations.ts
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // `toast` comes from @framework/components/ui/toast — never from `sonner`,
      // which `local/no-direct-toast` blocks. Same call shape either way.
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// In the form component
const { mutate: createUser, isPending } = useCreateUser();

const onSubmit = (values: FormValues) => {
  createUser(values);
};
```

---

## Form component pattern

```tsx
export const UserForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { mutate, isPending } = useCreateUser();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                aria-invalid={fieldState.invalid || undefined}
                {...field}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Button type="submit" isLoading={isPending}>
          Save changes
        </Button>
      </FieldGroup>
    </form>
  );
};
```

`Controller` and `useForm` come straight from `react-hook-form`; layout comes from `field.tsx`.
There is no wrapper layer in between — the repo had one (`form.tsx`'s `Form`/`FormField`/`FormItem`
family) that no file ever imported in the entire history of the repo, and it has been deleted.

Two rules the shape above encodes:

- **`id` and `aria-invalid` are stated explicitly.** The deleted `FormControl` injected them; nothing
  does now. A `FieldLabel` whose `htmlFor` points at nothing is the single most common way this
  pattern breaks, and it breaks silently.
- **`data-invalid` on the `Field`, `aria-invalid` on the control — both, always.** `data-invalid`
  colours the label and the message; `aria-invalid` colours the control's border and announces the
  error. Neither substitutes for the other. Use `|| undefined` so a valid field carries no attribute
  at all, since `data-invalid="false"` still matches `[data-invalid]`.

---

## Container selection (DESIGN.md §6/§7)

Five container types, each with one job — don't substitute one for another. These are fixed
skeleton behavior (not something to ask a client about — see `plan-new-page`/`plan-new-feature`):

- **Creating new data** → in-page form (a `Card` in the normal page flow, or a
  dedicated page) — see "Page layout" below
- **Editing existing data, or any form** → **either** a side sheet (`Sheet`,
  `platform/src/components/ui/sheet.tsx` — fixed width 448px via `sm:max-w-md`, inside the
  400–480px range, carries the leading-edge radius) **or** a modal (`Dialog`). Both are valid;
  **ask the user which** rather than picking silently — see "Choosing between a side sheet and a
  modal" below
- **Confirming or warning** → modal (`Dialog`/`AlertDialog`)
- **Informing or hinting** (non-blocking, no input required) → popover (`Popover`)
- **Dropdown / selection menus** → the third permitted user of the overlay shadow
  (`--elevation-3`), alongside modals and popovers — not yet fully specified beyond that

### Choosing between a side sheet and a modal

A form can live in either. This is the one container decision that is **not** yours to make
silently — **always clarify it with the user**, offering the default below as the pre-selected
answer so the question costs them one click rather than an essay.

**Actions opened from a datatable default to a side sheet** — a row action, a bulk action, or a
toolbar action on a `DataTable` page. The table stays visible behind the sheet, which is the point:
the user keeps their place in the list.

**That default covers form/edit actions only.** Destructive confirmations are unaffected and still
go through `ConfirmDialog` (an `AlertDialog`) — see `.claude/rules/components-rules.md`, which
requires destructive row and bulk actions to sit inside one. "Prefer a side sheet from a datatable"
never means "confirm a delete in a side sheet".

### Guarding unsaved changes

Both containers discard whatever was typed the moment they close — backdrop click, Esc, the X, a
Cancel inside `DialogClose`. So a form in either one is wired to the guard:

```tsx
const guard = useUnsavedChangesGuard({ when: form.formState.isDirty });

<Sheet open={isOpen} onOpenChange={guard.guardOpenChange(setIsOpen)}>
  <SheetContent>
    <UserForm onSuccess={() => setIsOpen(false)} />
    <UnsavedChangesDialog guard={guard} />
  </SheetContent>
</Sheet>;
```

`when` is the dirty check — `formState.isDirty` from react-hook-form, not a hand-rolled flag. The
same call also blocks route navigation away from the page, so one hook covers both exits.

Enforced, not just recommended: `local/require-unsaved-guard` errors on a `Dialog`/`Sheet`
containing a field primitive or a `*Form` component when the file never calls the hook, and a
PostToolUse hook flags it while you are still editing. Where discarding is the expected outcome of
closing (a draft-then-apply filter panel), add an `eslint-disable-next-line` for the rule so the
exception is deliberate and reviewable.

The open/close state always lives in the parent page component, not inside the form.

```tsx
// Parent page owns open state
const [isOpen, setIsOpen] = useState(false);

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent>
    <UserForm onSuccess={() => setIsOpen(false)} />
  </SheetContent>
</Sheet>;
```

---

## Form styling

- Input at rest: `bg-card border border-border-dark rounded-sm h-10 px-3` — `rounded-sm` (4px)
  matches Button per DESIGN.md §349; the fill/border are this repo's customizations, see
  `docs/architecture/ui.md`
- Input focused: ring-2 ring-ring ring-offset-2 only — border color unchanged
- Input error: `aria-invalid` on the control plus `data-invalid` on its `Field` — never a hand-added
  `border-destructive`, which duplicates what `aria-invalid` already styles
- Input disabled: a flat token replacement — `bg-muted` / `border-border` / `text-disabled-text`,
  never `opacity-50`. Same principle as Buttons' disabled treatment (DESIGN.md §6), and
  `.claude/rules/components-rules.md` § Forms states it for fields
- Two-column layout only for short adjacent fields (First/Last name, date ranges)
- Never three columns

---

## Edit forms

Pass the existing record as `defaultValues` to pre-populate:

```ts
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: user
    ? {
        fullName: user.fullName,
        email: user.email,
      }
    : undefined,
});
```

Use a separate `useUpdateUser` mutation that takes an id + payload.

---

## Page layout — how to wrap forms

**Don't wrap it by hand — use a template.** `SingleCardTemplate` already is this shape, and it
owns the width, the card and the header placement:

```tsx
export const Page = () => (
  <SingleCardTemplate
    title="Add vendor"
    subtitle="Register a new supplier."
    width="narrow"
  >
    <PageForm ... />
  </SingleCardTemplate>
);
```

- `width="narrow"` is the default form width (`max-w-2xl`, 672px). `width="wide"` fills the page,
  for a management/search page
- `headerPlacement="above"` (default) puts the title over the card — the standalone/public shape.
  `"inside"` moves it into the card header, for a page that already has app chrome above it
- The action bar goes in `children`, at the end of the form. There is no `actions` hole on purpose:
  a submit button outside the `<form>` would not submit it (`docs/architecture/templates.md`)

**What NOT to hand-roll**, because the layers above already do it and doubling it is the usual bug:

- **No `min-h-screen`, no page background, no page padding.** `PageLayout` applies
  `px-4 sm:px-6 py-6 sm:py-8` once around every page (DESIGN.md §7). A page that adds its own
  doubles the gutter
- **No `max-w-*` on the page or the card.** The template sets it. Setting it in two places is how
  a form ends up narrower than intended
- **No `p-8` on `CardContent`.** `Card` owns its inset via `--card-spacing` — 16px below `sm`,
  24px at `sm`+. `p-8` (32px) is off that scale and removes the mobile step-down

### Header & Subtitle

- Pass `title` and `subtitle` to the template; **do not render a header block yourself.**
  `SingleCardTemplate` centres them over a `narrow` card and left-aligns them for `wide` or for
  `headerPlacement="inside"` — that placement rule is the template's to apply, and it is the one
  case where header/subtitle differ from table pages (see `build-datatable`).
- Bottom margin between the header block and the form Card: `space-6` (24px, i.e. `gap-6`/`mb-6` on
  the wrapping div) — matches the `space-y-6` already in the layout snippet above.

### Action buttons

- Form action buttons (Save/Submit, Cancel) sit right-aligned (`justify-end`) as a cluster, not
  spread with `space-between` — Cancel to the left of the primary action.
- A divider line (`border-border`, using the `--color-card-border` token) sits `space-3` (12px)
  above the button row to mark the end of the form — e.g. wrap the actions in
  `<div className="border-t border-border pt-3 flex justify-end gap-2">`.
- Only one button in the group may use the Primary (default) variant — every other action uses a
  Secondary variant (filled or outline).

### FormProvider is only for nested field components

`useForm` + `Controller` covers a form whose fields live in one component, which is most of them.
Reach for react-hook-form's `FormProvider` (plus `useFormContext`) only when fields are split across
child components and threading `control` as a prop gets silly. There is no repo-local `<Form>`
wrapper to use instead — that was `form.tsx`, now deleted.

---

## Responsiveness

**Always design mobile-first.** These are the most common breakage points in forms:

**Side-by-side fields** — use `grid-cols-1 sm:grid-cols-2` so fields stack on mobile:

```tsx
<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <Controller name="firstName" ... />
  <Controller name="lastName" ... />
</FieldGroup>
```

The columns go on a `FieldGroup`, not a bare `div` — form layout stays Field's to own
(`.claude/skills/shadcn/rules/forms.md`).

**Inline compound fields** (like country code + mobile number) — the inner container must handle overflow:

```tsx
<div className="flex flex-col gap-2 sm:flex-row">
  <div className="w-full sm:w-2/5">{/* country selector */}</div>
  <div className="flex-1 min-w-0">
    {" "}
    {/* min-w-0 prevents flex overflow */}
    {/* number input */}
  </div>
</div>
```

`min-w-0` on flex children is critical — without it, flex items won't shrink below their content width and will overflow the screen on mobile.

**Page padding and card padding — do neither by hand; both are already handled.**

This section used to tell you to write `min-h-screen py-6 px-3 sm:py-8 sm:px-6` on a page
wrapper and `p-4 sm:p-8` on `CardContent`. Both are now wrong:

- Page-edge padding belongs to `PageLayout` (DESIGN.md §7), which applies `px-4 sm:px-6 py-6
  sm:py-8` once, around every page. A page that adds its own **doubles** it. A page also does not
  own `min-h-screen` or a background — that is route chrome.
- `Card` sets `--card-spacing` to **16px below `sm` and 24px at `sm`+**, so `CardContent` is already
  tighter on mobile. Overriding with `p-4 sm:p-8` fights it, and `p-8` (32px) is off the card's own
  scale.

Reach for a `className` here only for a genuine one-off, and say why in a comment.

**Touch targets** — `Input` and `Button` already default to 40px height (`Button` bumps to 48px on
mobile automatically) — don't override with manual `h-10`/`h-12` classes unless a specific field
genuinely needs a different size.

**Always test mentally at 375px width** (iPhone SE) before considering a form done.

---

## What NOT to do

- Do not use uncontrolled inputs — always use react-hook-form
- Do not call supabase directly in the form component
- Do not manage mutation state (loading, error) manually — useMutation handles it
- Do not show raw error messages from supabase to the user — map to friendly messages
- Do not use export default
