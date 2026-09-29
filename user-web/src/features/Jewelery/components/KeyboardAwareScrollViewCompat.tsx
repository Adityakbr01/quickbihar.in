import React from "react";
import { cn } from "@/src/lib/utils";

type KeyboardAwareScrollViewCompatProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  contentContainerStyle?: React.CSSProperties;
  className?: string;
  contentClassName?: string;
  /** Accepted for ScrollView API compatibility — ignored on web. */
  keyboardShouldPersistTaps?: "always" | "never" | "handled" | boolean;
  [key: string]: any;
};

/**
 * Plain div wrapper accepting ScrollView-like props.
 * `keyboardShouldPersistTaps` and other native-only props are accepted
 * for API compatibility and ignored on web.
 */
export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  style,
  contentContainerStyle,
  className,
  contentClassName,
  ...rest
}: KeyboardAwareScrollViewCompatProps) {
  // Strip native-only props so they never leak onto the DOM.
  const {
    contentContainerClassName: _ccc,
    showsVerticalScrollIndicator: _sv,
    showsHorizontalScrollIndicator: _sh,
    nestedScrollEnabled: _ns,
    horizontal: _h,
    pagingEnabled: _p,
    scrollEventThrottle: _t,
    onMomentumScrollEnd: _m,
    onScroll: _o,
    decelerationRate: _d,
    keyboardDismissMode: _k,
    extraScrollHeight: _e,
    enableOnAndroid: _ea,
    enableAutomaticScroll: _eas,
    ...domProps
  } = rest as any;

  void keyboardShouldPersistTaps;

  return (
    <div style={{ overflowY: "auto", ...style }} className={cn("w-full", className)} {...domProps}>
      <div style={contentContainerStyle} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
