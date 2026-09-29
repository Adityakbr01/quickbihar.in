import React from "react";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";

import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";

interface HomeHeaderProps {
  menuOpen?: boolean;
  toggleMenu?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const width = useWindowWidth();
  const theme = useTheme();

  // Desktop web uses the custom top DesktopNavbar — hide the mobile
  // brand row there so we don't render two headers. Mobile untouched.
  if (width >= BREAKPOINTS.desktopMin) return null;

  return (
    <header className="flex h-[52px] flex-row items-center justify-between px-5">
      <div className="flex flex-row items-center">
        <h1
          className="text-xl font-black tracking-tight"
          style={{ color: theme.text }}
        >
          Quick Bihar
        </h1>
      </div>

      <div className="flex flex-row items-center gap-2">
        <ModuleSwitcherButton />
      </div>
    </header>
  );
};

export default HomeHeader;
