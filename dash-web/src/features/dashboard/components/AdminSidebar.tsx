import { Badge } from "@/components/ui/badge";
import SidebarFooter from "@/components/dashboard/SidebarFooter";
import { cn } from "@/lib/utils";
import { navigationGroups } from "./types";
import type { AdminSection } from "./types";

export function AdminSidebar({
  activeSection,
  counts,
  onSectionChange,
  forceVertical = false,
}: {
  activeSection: AdminSection;
  counts: {
    people: number;
    sellers: number;
    riders: number;
    malls: number;
    payouts: number;
    mallRequests: number;
    pendingReviews?: number;
  };
  onSectionChange: (section: AdminSection) => void;
  /**
   * Render the desktop vertical layout regardless of viewport — used
   * inside the mobile navigation drawer (the default responsive layout
   * is a horizontal scroll strip on small screens).
   */
  forceVertical?: boolean;
}) {
  const countBySection: Partial<Record<AdminSection, number>> = {
    people: counts.people,
    "seller-directory": counts.sellers,
    "rider-directory": counts.riders,
    "seller-mall": counts.malls + counts.mallRequests,
    "seller-submissions": counts.pendingReviews,
    payouts: counts.payouts,
  };

  return (
    <aside
      className={cn(
        forceVertical
          ? "flex h-full w-full flex-col overflow-hidden bg-background"
          : "shrink-0 border-b border-border bg-background lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r",
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary shadow-xs">
          QB
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">QuickBihar</div>
          <div className="text-xs text-primary font-medium">Admin Portal</div>
        </div>
      </div>
      <nav
        className={cn(
          forceVertical
            ? "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
            : "scrollbar-none flex overflow-x-auto px-3 py-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:space-y-4",
        )}
      >
        {navigationGroups.map((group) => (
          <div
            key={group.title}
            className={cn(forceVertical ? "flex flex-col gap-1" : "flex shrink-0 lg:flex-col lg:space-y-1")}
          >
            <div
              className={cn(
                "px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                !forceVertical && "hidden lg:block",
              )}
            >
              {group.title}
            </div>
            {group.items.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
                className={cn(
                  "w-full h-10 flex items-center justify-start gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 outline-none text-left",
                  activeSection === section.id
                    ? "bg-primary font-medium text-on-primary shadow-xs hover:bg-primary hover:text-on-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <span className="shrink-0">{section.icon}</span>
                <span className="truncate">{section.label}</span>
                {countBySection[section.id] !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-auto min-w-7 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold shadow-sm",
                      countBadgeClass(
                        countBySection[section.id] || 0,
                        activeSection === section.id,
                      ),
                    )}
                  >
                    {formatSidebarCount(countBySection[section.id] || 0)}
                  </Badge>
                )}
              </button>
            ))}
            </div>
          ))}
        </nav>
        <SidebarFooter current="admin" />
      </aside>
  );
}

// Helper functions used by AdminSidebar
export function countBadgeClass(count: number, isActive?: boolean) {
  if (isActive) {
    return "border-white/25 bg-white/15 text-on-primary shadow-sm";
  }
  if (count >= 15) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200 shadow-emerald-500/10";
  }
  if (count <= 5) {
    return "border-red-400/30 bg-red-400/10 text-red-800 dark:text-red-200 shadow-red-500/10";
  }
  return "border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200 shadow-amber-500/10";
}

export function formatSidebarCount(count: number) {
  return count > 99 ? "99+" : count;
}
