import { useEffect, useState } from "react";

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Read CSS env(safe-area-inset-*) via a hidden probe element. */
function readInsets(): EdgeInsets {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return ZERO;
  }
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  probe.style.paddingTop = "env(safe-area-inset-top, 0px)";
  probe.style.paddingRight = "env(safe-area-inset-right, 0px)";
  probe.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
  probe.style.paddingLeft = "env(safe-area-inset-left, 0px)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const px = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const out: EdgeInsets = {
    top: px(cs.paddingTop),
    right: px(cs.paddingRight),
    bottom: px(cs.paddingBottom),
    left: px(cs.paddingLeft),
  };
  probe.remove();
  return out;
}

/**
 * Device safe-area insets (notch / home indicator) on web.
 * Re-read on resize / orientation change.
 */
export function useSafeAreaInsets(): EdgeInsets {
  const [insets, setInsets] = useState<EdgeInsets>(readInsets);

  useEffect(() => {
    const onChange = () => setInsets(readInsets());
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    onChange();
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);

  return insets;
}

export default useSafeAreaInsets;
