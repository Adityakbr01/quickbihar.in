import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManagementFeatureCard } from "./cards";
import type { AdminSection } from "./types";
import type { ManagementGroup } from "@/features/dashboard/api/adminManagement.api";

export function ManagementGroupSection({
  group,
  title,
  isLoading,
  onOpenSection,
  quickLinks = [],
}: {
  group?: ManagementGroup;
  title: string;
  isLoading: boolean;
  onOpenSection?: (section: AdminSection) => void;
  quickLinks?: Array<{ label: string; section: AdminSection }>;
}) {
  if (isLoading) {
    return (
      <div className="py-10 text-sm text-muted-foreground">
        Loading management modules...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="py-10 text-sm text-muted-foreground">
        No management data found for {title}.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base text-foreground">{group.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {group.features.map((feature) => (
            <ManagementFeatureCard key={feature.name} feature={feature} />
          ))}
        </CardContent>
      </Card>

      {quickLinks.length > 0 && onOpenSection && (
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-foreground">
              Live Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button
                key={link.section}
                variant="outline"
                className="border-border bg-muted text-foreground hover:bg-muted"
                onClick={() => onOpenSection(link.section)}
              >
                {link.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
