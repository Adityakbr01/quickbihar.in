import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/theme/Provider/ThemeProvider";
import { useModuleStore } from "@/store/useModuleStore";
import { APP_MODULES, type ModuleId } from "@/constants/modules";
import { triggerHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Sun,
  Moon,
  Search,
  ShoppingCart,
  MapPin,
  Navigation,
  User,
} from "lucide-react";

export const AppNavbar: React.FC = () => {
  const { isDark, toggleMode } = useTheme();
  const { currentModuleId, setModule } = useModuleStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleModuleClick = (modId: ModuleId, route: string) => {
    triggerHaptic("selection");
    setModule(modId);
    navigate(route);
  };

  const handleThemeToggle = () => {
    triggerHaptic("light");
    toggleMode();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span>⚡ Super-Fast Delivery across Patna, Gaya, Muzaffarpur & All Bihar</span>
        <span className="hidden sm:inline opacity-80">|</span>
        <span className="hidden sm:inline opacity-90">100% Genuine Local Stores & Verified Malls</span>
      </div>

      {/* Main Bar */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => triggerHaptic("medium")}
          className="flex items-center gap-2.5 shrink-0 text-decoration-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm transition-transform group-hover:scale-105">
            QB
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-foreground">QuickBihar</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 border-primary/50 text-primary">
                Web
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary" />
              <span>Patna, Bihar</span>
            </div>
          </div>
        </Link>

        {/* Module Switcher Tabs (Clothing, Jewelry, Food) */}
        <nav className="hidden md:flex items-center bg-muted/80 p-1 rounded-xl border border-border/60">
          {APP_MODULES.map((mod) => {
            const isActive =
              (mod.id === "clothing" && (location.pathname === "/" || location.pathname.startsWith("/clothing"))) ||
              (mod.id === "jewelery" && location.pathname.startsWith("/jewelery")) ||
              (mod.id === "food" && location.pathname.startsWith("/food"));

            const Icon =
              mod.id === "clothing"
                ? Shirt
                : mod.id === "jewelery"
                ? Sparkles
                : UtensilsCrossed;

            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id, mod.route)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-background text-foreground shadow-xs scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? mod.badgeColor : undefined }}
                />
                <span>{mod.name}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: mod.badgeColor }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-xs lg:max-w-md hidden lg:block relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              currentModuleId === "food"
                ? "Search dishes, restaurants, Biryani, Litti..."
                : currentModuleId === "jewelery"
                ? "Search rings, necklaces, 22K gold, diamonds..."
                : "Search sarees, shirts, kurtas, deals, malls..."
            }
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link to="/track-order" onClick={() => triggerHaptic("light")}>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs rounded-xl">
              <Navigation className="w-3.5 h-3.5 text-primary" />
              <span>Track</span>
            </Button>
          </Link>

          <Link to="/cart" onClick={() => triggerHaptic("medium")}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 rounded-xl relative cursor-pointer">
              <ShoppingCart className="w-4 h-4 text-foreground" />
              <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                2
              </span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="rounded-xl cursor-pointer"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-xl cursor-pointer">
            <User className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Mobile Module Switcher Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-border/60 bg-muted/30 px-2 py-1.5">
        {APP_MODULES.map((mod) => {
          const isActive =
            (mod.id === "clothing" && (location.pathname === "/" || location.pathname.startsWith("/clothing"))) ||
            (mod.id === "jewelery" && location.pathname.startsWith("/jewelery")) ||
            (mod.id === "food" && location.pathname.startsWith("/food"));

          const Icon =
            mod.id === "clothing"
              ? Shirt
              : mod.id === "jewelery"
              ? Sparkles
              : UtensilsCrossed;

          return (
            <button
              key={mod.id}
              onClick={() => handleModuleClick(mod.id, mod.route)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? mod.badgeColor : undefined }} />
              <span>{mod.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default AppNavbar;
