import { ArrowRight } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { BREAKPOINTS, useWindowWidth } from "@/src/utils/responsive";
import { useTopPad } from "@/src/hooks/useTopPad";
import { ModuleSwitcherButton } from "@/src/components/common/ModuleSwitcherButton";
import { APP_NAME } from "@/src/constants";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";

/**
 * Mobile header bar for the Jewellery home screen.
 * Extracted from JeweleryHomeScreen (`Header`).
 *
 * Desktop (>= BREAKPOINTS.desktopMin) returns null because the global
 * JeweleryDesktopNavbar is used instead — this avoids rendering two headers.
 * Preserves exact layout, colors, typography, and module-switcher behavior.
 */
export function Header() {
  const colors = useColors();
  useTopPad();
  const windowWidth = useWindowWidth();
  // Desktop web uses the global JeweleryDesktopNavbar — hide the mobile
  // brand row there so we don't render two headers. Mobile untouched.
  if (windowWidth >= BREAKPOINTS.desktopMin) return null;
  // Narrow phones: icon-only switcher so logo + search + pill fit 360px.
  const compactSwitcher = windowWidth < 400;

  return (
    <div
      className="flex flex-row items-center justify-between border-b px-4 py-2"
      style={{
        backgroundColor: colors.ivory,
        borderBottomColor: colors.midGray,
        borderBottomWidth: 1,
      }}
    >
      <span
        className="text-[18px] tracking-[4px]"
        style={{
          color: colors.ink,
          fontFamily: "CormorantGaramond_600SemiBold",
        }}
      >
        {APP_NAME}
      </span>
      <div
        className="flex flex-row items-center"
        style={{ ...(compactSwitcher ? { gap: 2.5 } : { gap: 3 }) }}
      >
        <ModuleSwitcherButton compact={compactSwitcher} />
      </div>
    </div>
  );
}
