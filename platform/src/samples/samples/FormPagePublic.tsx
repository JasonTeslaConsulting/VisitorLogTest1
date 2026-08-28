/**
 * Sample: Form Page Public — a create form whose title block sits ABOVE the card.
 *
 * The standalone shape. A real copy renders with **no navbar** (`realLayout: "none"`,
 * `realAccess: "public"` in the sample registry) — the title block is the page's only
 * chrome, which is why it sits above the card rather than inside it. This preview does
 * show a navbar: every sample route is `layout: "default"` or the sample menu
 * disappears, so the registry records the truth a copy needs.
 *
 * Its sibling Form Page Internal is this exact form with `headerPlacement="inside"`.
 *
 * Inline mock content only — previews must render on a fresh clone with no .env.
 */

import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { Button } from "@framework/components/ui/button";
import { Input } from "@framework/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@framework/components/ui/field";
import { Textarea } from "@framework/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";

export const FormPagePublic = () => {
  return (
    <SingleCardTemplate
      title="Add vendor"
      subtitle="Register a new supplier so purchase orders can be raised against them."
      width="narrow"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="preview-name">Vendor name</FieldLabel>
          <Input id="preview-name" placeholder="Acme Industrial Supplies" />
        </Field>

        {/* A responsive pair stays a grid — FieldGroup carries the columns rather
            than a bare div, so the form layout is still Field's to own. */}
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="preview-contact">Contact</FieldLabel>
            <Input id="preview-contact" placeholder="Jane Doe" />
          </Field>
          <Field>
            <FieldLabel htmlFor="preview-email">Email</FieldLabel>
            <Input id="preview-email" placeholder="jane@acme.com" />
          </Field>
        </FieldGroup>

        <Field>
          <FieldLabel htmlFor="preview-category">Category</FieldLabel>
          <Select>
            <SelectTrigger id="preview-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parts">Parts</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="preview-notes">Notes</FieldLabel>
          <Textarea id="preview-notes" placeholder="Anything worth flagging" />
        </Field>

        {/* The action bar lives in `children`, not a template hole — see
            docs/architecture/templates.md. `FormBody` will own this shape. */}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save vendor</Button>
        </div>
      </FieldGroup>
    </SingleCardTemplate>
  );
};
