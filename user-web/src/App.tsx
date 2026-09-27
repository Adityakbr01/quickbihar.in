import { useTheme } from "@/theme/Provider/ThemeProvider";
import { useModuleStore } from "@/store/useModuleStore";
import { APP_MODULES, type ModuleId } from "@/constants/modules";
import { useColors } from "@/features/Jewelery/hooks/useColors";
import { useFoodColors } from "@/features/Food/hooks/useFoodColors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Sparkles, Shirt, UtensilsCrossed, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function App() {
  const { mode, toggleMode, isDark } = useTheme();
  const { currentModuleId, setModule } = useModuleStore();
  const jewelryColors = useColors();
  const foodColors = useFoodColors();

  const handleModuleChange = (id: ModuleId) => {
    setModule(id);
    const mod = APP_MODULES.find((m) => m.id === id);
    toast.success(`Switched to ${mod?.name} Module`, {
      description: `Active color theme updated dynamically.`,
    });
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-md">
              QB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">QuickBihar</span>
                <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider">
                  Web Portal
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Multi-Module Super App (Clothing • Jewelry • Food)
              </p>
            </div>
          </div>

          {/* Module Selector & Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted p-1 rounded-xl gap-1">
              {APP_MODULES.map((mod) => {
                const isActive = currentModuleId === mod.id;
                const Icon =
                  mod.id === "clothing"
                    ? Shirt
                    : mod.id === "jewelery"
                    ? Sparkles
                    : UtensilsCrossed;

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleChange(mod.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? mod.badgeColor : undefined }} />
                    <span className="hidden md:inline">{mod.name}</span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleMode}
              className="rounded-xl ml-1 cursor-pointer"
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 max-w-5xl space-y-8">
        {/* Module Banner */}
        <section
          className={`p-6 rounded-2xl border transition-all ${
            currentModuleId === "food"
              ? isDark
                ? "bg-[rgba(225,29,72,0.12)] border-[rgba(225,29,72,0.35)]"
                : "bg-[#FFF1F2] border-[#FECDD3]"
              : currentModuleId === "jewelery"
              ? isDark
                ? "bg-[#1E1915] border-[#3A3028]"
                : "bg-[#F7F3EC] border-[#C4BDB4]"
              : isDark
              ? "bg-muted/40 border-border"
              : "bg-muted/30 border-border"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor:
                      currentModuleId === "clothing"
                        ? "#4F46E5"
                        : currentModuleId === "jewelery"
                        ? "#D97706"
                        : "#E11D48",
                  }}
                />
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Active Module Color Space: {currentModuleId}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentModuleId === "clothing" && "Fashion & Streetwear Collection"}
                {currentModuleId === "jewelery" && "Exquisite Heritage & Contemporary Jewelry"}
                {currentModuleId === "food" && "QuickBihar Fresh Food & Delicacies"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {currentModuleId === "clothing" &&
                  "Engineered with Indigo (#4F46E5) and QuickBihar lime branding for clean urban e-commerce."}
                {currentModuleId === "jewelery" &&
                  "Handcrafted with Luxury Gold (#B8924A), Ivory (#F7F3EC), Pearl (#EDE8DF), Champagne, and Noir tones."}
                {currentModuleId === "food" &&
                  "Infused with Hot Crimson Rose (#E11D48) and appetizing fresh tones delivering in 20 minutes."}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() =>
                  toast.info(`Active Theme: ${currentModuleId.toUpperCase()}`, {
                    description: `Mode: ${mode.toUpperCase()} | Ready for component migration.`,
                  })
                }
              >
                Explore {currentModuleId}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* Color Palette Inspection Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Module Design Tokens & Colors</h2>
            <span className="text-xs text-muted-foreground">Synchronized with mobile definitions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clothing Token Card */}
            <Card
              className={`transition-all ${
                currentModuleId === "clothing" ? "ring-2 ring-[#4F46E5] shadow-md" : "opacity-80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-[#4F46E5]" /> Clothing
                  </CardTitle>
                  <Badge style={{ backgroundColor: "#4F46E5", color: "#fff" }}>#4F46E5</Badge>
                </div>
                <CardDescription>Indigo Fashion Palette</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Badge Accent</span>
                  <span className="font-mono font-semibold text-[#4F46E5]">#4F46E5</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Brand Secondary</span>
                  <span className="font-mono font-semibold text-[#80C314]">#80C314 (Lime)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Mode Status</span>
                  <span className="font-semibold capitalize">{mode} Mode Active</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={currentModuleId === "clothing" ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleModuleChange("clothing")}
                >
                  {currentModuleId === "clothing" ? "Active Module" : "Switch to Clothing"}
                </Button>
              </CardFooter>
            </Card>

            {/* Jewelery Token Card */}
            <Card
              className={`transition-all ${
                currentModuleId === "jewelery" ? "ring-2 ring-[#B8924A] shadow-md" : "opacity-80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B8924A]" /> Jewelry
                  </CardTitle>
                  <Badge style={{ backgroundColor: "#B8924A", color: "#fff" }}>#B8924A</Badge>
                </div>
                <CardDescription>Luxury Gold & Ivory System</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Gold Primary</span>
                  <span className="font-mono font-semibold text-[#B8924A]">{jewelryColors.gold || "#B8924A"}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Ivory Background</span>
                  <span className="font-mono font-semibold">{jewelryColors.ivory || "#F7F3EC"}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Pearl Card</span>
                  <span className="font-mono font-semibold">{jewelryColors.pearl || "#EDE8DF"}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={currentModuleId === "jewelery" ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleModuleChange("jewelery")}
                >
                  {currentModuleId === "jewelery" ? "Active Module" : "Switch to Jewelry"}
                </Button>
              </CardFooter>
            </Card>

            {/* Food Token Card */}
            <Card
              className={`transition-all ${
                currentModuleId === "food" ? "ring-2 ring-[#E11D48] shadow-md" : "opacity-80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#E11D48]" /> Food
                  </CardTitle>
                  <Badge style={{ backgroundColor: "#E11D48", color: "#fff" }}>#E11D48</Badge>
                </div>
                <CardDescription>Hot Crimson & Rose Palette</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Crimson Primary</span>
                  <span className="font-mono font-semibold text-[#E11D48]">{foodColors.primary || "#E11D48"}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Banner Accent</span>
                  <span className="font-mono font-semibold">{isDark ? "Dark Rose" : "#FFF1F2"}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted">
                  <span>Star Rating</span>
                  <span className="font-mono font-semibold text-[#EAB308]">#EAB308</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={currentModuleId === "food" ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleModuleChange("food")}
                >
                  {currentModuleId === "food" ? "Active Module" : "Switch to Food"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Migration Ready Checklist */}
        <section className="p-6 rounded-2xl border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Migration Readiness Status</h3>
            <Badge variant="secondary" className="text-xs">
              All Packages Installed
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Axios & HTTP client</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>React Query + LocalStorage Persister</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Shadcn UI & Radix Primitives</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Zustand Module Store</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>React Hook Form & Zod</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Socket.io & Dayjs</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Framer Motion & DotLottie</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Leaflet Live Map Tracking</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Module Themes (Clothing, Jewelry, Food)</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}