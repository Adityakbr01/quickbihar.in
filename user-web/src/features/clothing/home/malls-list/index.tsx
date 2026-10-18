import React from "react";
import { ChevronLeft, CircleAlert, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { usePublicMalls } from "../hooks/useMalls";
import { MallCard } from "../components/MallCard";
import { goBack, toWebPath } from "@/src/utils/navigation";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { cn } from "@/src/lib/utils";

/**
 * All-malls listing (/malls) — target of the "Explore All" button in the
 * Top 10 Malls home section. Renders every public mall as a crawlable
 * `<Link>`-equivalent card (MallCard navigates to /mall/:slug).
 */
const MallsListScreen: React.FC = () => {
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { data: malls, isLoading, isError, refetch } = usePublicMalls();

  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const isWide = width >= BREAKPOINTS.tabletMin;

  const handleBack = () => {
    goBack(navigate);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col" style={{ backgroundColor: theme.background }}>
        <div className={cn("w-full", isWide && "mx-auto max-w-[1280px] px-6")}>
          <div className="flex flex-row items-center gap-2 p-4">
            <span
              className="block h-6 w-6 animate-pulse rounded-full"
              style={{ backgroundColor: theme.secondaryBackground }}
            />
            <span
              className="block h-6 w-40 animate-pulse rounded-lg"
              style={{ backgroundColor: theme.secondaryBackground }}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 pb-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-[220px] animate-pulse rounded-[20px]"
                style={{ backgroundColor: theme.secondaryBackground }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !malls) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ backgroundColor: theme.background }}
      >
        <CircleAlert size={60} color={theme.primary} />
        <p className="mt-4 text-center text-base font-medium" style={{ color: theme.text }}>
          Could not load malls.
        </p>
        <div className="mt-6 flex flex-row gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="cursor-pointer rounded-lg px-5 py-3 font-semibold"
            style={{ backgroundColor: theme.secondaryBackground, color: theme.text }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="cursor-pointer rounded-lg px-5 py-3 font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col" style={{ backgroundColor: theme.background }}>
      <div className={cn("w-full", isWide && "mx-auto max-w-[1280px] px-6")}>
        <div className="flex flex-row items-center gap-1 p-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
          >
            <ChevronLeft size={24} color={theme.text} />
          </button>
          <div className="ml-1">
            <nav className="flex flex-row items-center text-xs" aria-label="Breadcrumb">
              <Link to="/" style={{ color: theme.secondaryText }}>
                Home
              </Link>
              <span style={{ color: theme.secondaryText }}>{"  ›  "}</span>
              <span style={{ color: theme.secondaryText }}>Malls</span>
            </nav>
            <h1 className="text-2xl font-extrabold" style={{ color: theme.text }}>
              All Malls
            </h1>
            <p className="text-xs" style={{ color: theme.secondaryText }}>
              {malls.length} mall{malls.length === 1 ? "" : "s"} in Bihar
            </p>
          </div>
        </div>

        {malls.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16">
            <Store size={48} color={theme.tertiaryText} />
            <p className="text-sm" style={{ color: theme.secondaryText }}>
              No malls listed yet — check back soon.
            </p>
            <Link to={toWebPath("/(tabs)/clothing/home")}>Browse the home feed</Link>
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3",
              isDesktop ? "pb-6" : "pb-28",
            )}
          >
            {malls.map((mall: any) => (
              <MallCard key={mall._id || mall.id || mall.slug} mall={mall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MallsListScreen;
