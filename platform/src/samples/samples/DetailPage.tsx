/**
 * Sample: a record detail view, on the split-card template at ratio=aside-left.
 * Inline mock content only — previews must render on a fresh clone with no .env.
 */

import { SplitCardTemplate } from "@framework/templates/SplitCardTemplate";
import { Badge } from "@framework/components/ui/badge";
import { Button } from "@framework/components/ui/button";
import { Separator } from "@framework/components/ui/separator";

const SUMMARY = [
  { label: "Vendor code", value: "ACM-0142" },
  { label: "Category", value: "Parts" },
  { label: "Owner", value: "Jane Doe" },
  { label: "Created", value: "12 Mar 2026" },
];

export const DetailPage = () => {
  return (
    <SplitCardTemplate
      title="Acme Industrial"
      ratio="aside-left"
      headerActions={<Button variant="outline">Edit vendor</Button>}
      aside={
        <div className="space-y-4">
          <Badge>Active</Badge>
          <Separator />
          <dl className="space-y-3 text-sm">
            {SUMMARY.map((row) => (
              <div key={row.label}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      }
    >
      <div className="space-y-4">
        <h2 className="font-heading text-base font-medium">Purchase history</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span>PO #4417 — spare parts</span>
            <span className="text-muted-foreground">£12,400</span>
          </li>
          <li className="flex justify-between">
            <span>PO #4390 — bearings</span>
            <span className="text-muted-foreground">£3,180</span>
          </li>
          <li className="flex justify-between">
            <span>PO #4361 — hydraulic seals</span>
            <span className="text-muted-foreground">£880</span>
          </li>
        </ul>
      </div>
    </SplitCardTemplate>
  );
};
