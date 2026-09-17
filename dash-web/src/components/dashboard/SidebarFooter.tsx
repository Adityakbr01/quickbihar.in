import { Link } from "react-router-dom";
import { ArrowLeftRight, Bike, ExternalLink, Home, ShieldCheck, Store } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { hasRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type PortalId = "admin" | "seller" | "delivery";

const portals: Array<{
  id: PortalId;
  label: string;
  href: string;
  icon: typeof Store;
  roles: string[];
}> = [
  { id: "admin", label: "Admin Portal", href: "/admin/dashboard", icon: ShieldCheck, roles: ["ADMIN", "SUPER_ADMIN"] },
  { id: "seller", label: "Seller Panel", href: "/seller/dashboard", icon: Store, roles: ["SELLER"] },
  { id: "delivery", label: "Delivery Panel", href: "/delivery/dashboard", icon: Bike, roles: ["DELIVERY"] },
];

/**
 * Sidebar footer shared by all three dashboards. Ends portal confusion:
 * shows where "home" is, and — when the signed-in user holds more than
 * one portal role — offers one-tap switching to their other portals.
 * Hidden on small screens where sidebars collapse into a top strip.
 */
export default function SidebarFooter({ current }: { current: PortalId }) {
  const user = useAuthStore((state) => state.user);
  const others = portals.filter(
    (portal) => portal.id !== current && hasRole(user, ...portal.roles),
  );

  return (
    <div className="hidden border-t border-border p-3 lg:block">
      {others.length > 0 && (
        <div className="mb-2">
          <p className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <ArrowLeftRight className="h-3 w-3" />
            Switch portal
          </p>
          <div className="grid gap-1">
            {others.map((portal) => (
              <Link
                key={portal.id}
                to={portal.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <portal.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{portal.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <Link
        to="/"
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
        )}
      >
        <Home className="h-4 w-4 shrink-0" />
        <span className="truncate">Back to site</span>
      </Link>
      <a
        href="https://quickbihar.in/"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
        )}
      >
        <Store className="h-4 w-4 shrink-0" />
        <span className="truncate">Back to shop site</span>
        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
      </a>
    </div>
  );
}
