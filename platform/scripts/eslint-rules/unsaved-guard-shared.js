// The single source of truth for "does this look like an unguarded form in an overlay?".
//
// Shared deliberately: the ESLint rule (unsaved-guard.js, AST-precise, blocks CI) and the
// PostToolUse advisory hook (.claude/hooks/advise-unsaved-guard.mjs, text-based, nudges Claude
// mid-turn) must agree about what counts. Two copies of these lists would drift, and the failure
// mode is silent — lint passing while the hook nags, or worse.

/** Overlay containers whose contents can be dismissed without an explicit save. */
export const OVERLAY_COMPONENTS = new Set(["Dialog", "Sheet"]);

/**
 * Field primitives. Presence of one inside an overlay means data entry.
 *
 * NOT included: Label, Button, Form* subparts (FormItem/FormLabel/...) — a label alone is not
 * input, and the Form* parts always accompany a real control that is already on this list.
 */
export const FIELD_COMPONENTS = new Set([
  "Input",
  "InputGroup",
  "Textarea",
  "Select",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "DatePicker",
  "DateTimePicker",
  "TimePicker",
  "InputOTP",
]);

/**
 * A component whose name ends in `Form` counts as data entry too, and this half does most of the
 * work in practice. `.claude/skills/build-form-page/SKILL.md` tells agents to extract the form to
 * `src/components/<PageName>/<PageName>Form.tsx`, so in the normal case the page renders
 * `<Sheet><SheetContent><UserForm /></SheetContent></Sheet>` and the fields are in a different
 * file entirely — invisible to any same-file check.
 */
export const isFormComponentName = (name) =>
  typeof name === "string" && /[A-Za-z]Form$/.test(name);

export const GUARD_HOOK = "useUnsavedChangesGuard";

/**
 * `components/ui/**` is exempt, both roots — the same carve-out `local/no-off-scale-spacing` and
 * `local/no-raw-anchor` already use, for the same reason: those files *implement* the design system
 * rather than consume it.
 *
 * This is not a formality. `FilterSheet.tsx` is a Sheet full of fields that must never prompt — it
 * is draft-then-apply with its own Clear all / Apply footer, so discarding is the expected outcome
 * of closing it. Without this exemption the rule turns CI red the moment it lands.
 */
export const isExemptPath = (filePath) =>
  /(^|[\\/])(?:platform[\\/])?src[\\/]components[\\/]ui[\\/]/.test(
    String(filePath ?? ""),
  );

export const ADVICE = [
  `This overlay contains data entry but does not call ${GUARD_HOOK}.`,
  "Closing it — backdrop click, Esc, the X, or Cancel — discards whatever was typed, silently.",
  "",
  "  const guard = useUnsavedChangesGuard({ when: form.formState.isDirty });",
  "  <Dialog open={open} onOpenChange={guard.guardOpenChange(setOpen)}>",
  "    …",
  "    <UnsavedChangesDialog guard={guard} />",
  "",
  "If losing the input genuinely does not matter here, silence it explicitly:",
  "  // eslint-disable-next-line local/require-unsaved-guard",
].join("\n");
