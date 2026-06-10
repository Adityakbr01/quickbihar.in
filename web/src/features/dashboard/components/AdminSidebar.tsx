import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { navigationGroups } from "./types";
import type { AdminSection } from "./types";

export function AdminSidebar({
  activeSection,
  counts,
  onSectionChange,
}: {
  activeSection: AdminSection;
  counts: {
    people: number;
    sellers: number;
    malls: number;
    payouts: number;
    mallRequests: number;
  };
  onSectionChange: (section: AdminSection) => void;
}) {
  const countBySection: Partial<Record<AdminSection, number>> = {
    people: counts.people,
    "seller-mall": counts.sellers + counts.malls + counts.mallRequests,
    payouts: counts.payouts,
  };

  return (
    <aside className="shrink-0 border-b border-white/10 bg-[#181818] lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
          QB
        </div>
        <div>
          <div className="text-sm font-semibold text-white">QuickBihar</div>
          <div className="text-xs text-gray-500">Fashion Admin</div>
        </div>
      </div>
      <nav className="scrollbar-none flex overflow-x-auto px-3 py-3 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:space-y-4">
        {navigationGroups.map((group) => (
          <div
            key={group.title}
            className="flex shrink-0 gap-2 lg:flex-col lg:space-y-1"
          >
            <div className="hidden px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-gray-500 lg:block">
              {group.title}
            </div>
            {group.items.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full h-10 flex items-center justify-start gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 outline-none text-left",
                  activeSection === section.id
                    ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.05]",
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
    </aside>
  );
}

// Helper functions used by AdminSidebar
export function countBadgeClass(count: number, isActive?: boolean) {
  if (isActive) {
    return "border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-sm";
  }
  if (count >= 15) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10";
  }
  if (count <= 5) {
    return "border-red-400/30 bg-red-400/10 text-red-200 shadow-red-500/10";
  }
  return "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-amber-500/10";
}

export function formatSidebarCount(count: number) {
  return count > 99 ? "99+" : count;
}
