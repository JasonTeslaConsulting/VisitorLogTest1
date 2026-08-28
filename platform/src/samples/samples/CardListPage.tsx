/**
 * Sample: a card list, on the card-grid template at cardWidth=md.
 * Inline mock content only — previews must render on a fresh clone with no .env.
 */

import {
  PiUsers,
  PiFileText,
  PiCalendar,
  PiShield,
  PiChartBar,
  PiFolder,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { CardGridTemplate } from "@framework/templates/CardGridTemplate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@framework/components/ui/card";

const MODULES: { icon: IconType; title: string; description: string }[] = [
  {
    icon: PiUsers,
    title: "People",
    description: "Team members, roles and access.",
  },
  {
    icon: PiFileText,
    title: "Documents",
    description: "Contracts and signed records.",
  },
  {
    icon: PiCalendar,
    title: "Leave",
    description: "Requests, balances and approvals.",
  },
  {
    icon: PiShield,
    title: "Compliance",
    description: "Audits and certifications.",
  },
  {
    icon: PiChartBar,
    title: "Reporting",
    description: "Spend and utilisation.",
  },
  {
    icon: PiFolder,
    title: "Archive",
    description: "Closed and historical records.",
  },
];

export const CardListPage = () => {
  return (
    <CardGridTemplate
      title="Modules"
      subtitle="Pick an area to work in."
      cardWidth="md"
    >
      {MODULES.map((mod) => (
        <Card key={mod.title}>
          <CardHeader>
            <mod.icon className="size-5 text-muted-foreground" />
            <CardTitle>{mod.title}</CardTitle>
            <CardDescription>{mod.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Last updated today</p>
          </CardContent>
        </Card>
      ))}
    </CardGridTemplate>
  );
};
