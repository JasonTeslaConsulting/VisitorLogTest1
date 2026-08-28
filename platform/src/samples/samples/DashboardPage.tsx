/**
 * Sample: a dashboard, on the split-card template at ratio=equal.
 * Inline mock content only — previews must render on a fresh clone with no .env.
 */

import { SplitCardTemplate } from "@framework/templates/SplitCardTemplate";
import { Separator } from "@framework/components/ui/separator";

const APPROVALS = [
  { who: "Priya Nair", what: "Leave request — 3 days", when: "2 hours ago" },
  { who: "Tom Becker", what: "Expense claim — £412", when: "Yesterday" },
  { who: "Aisha Rahman", what: "Purchase order #4417", when: "Yesterday" },
];

export const DashboardPage = () => {
  return (
    <SplitCardTemplate
      title="Team dashboard"
      subtitle="What needs your attention today, and what the team has been doing."
      ratio="equal"
      aside={
        <div className="space-y-4">
          <h2 className="font-heading text-base font-medium">
            Recent activity
          </h2>
          <ul className="space-y-3 text-sm">
            {APPROVALS.map((item) => (
              <li key={item.what}>
                <p className="text-foreground">{item.what}</p>
                <p className="text-muted-foreground">
                  {item.who} · {item.when}
                </p>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="space-y-4">
        <h2 className="font-heading text-base font-medium">
          Awaiting approval
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-semibold text-foreground">7</p>
            <p className="text-sm text-muted-foreground">
              Requests in your queue
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-2xl font-semibold text-foreground">2</p>
            <p className="text-sm text-muted-foreground">
              Overdue by more than a day
            </p>
          </div>
        </div>
      </div>
    </SplitCardTemplate>
  );
};
