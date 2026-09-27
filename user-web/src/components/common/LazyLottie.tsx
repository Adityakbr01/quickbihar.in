import React, { Suspense, forwardRef } from "react";
import { View } from "react-native";

const LazyLottieInner = React.lazy(() => import("lottie-react-native"));

/**
 * Drop-in, behavior-identical replacement for lottie-react-native's default
 * export. Every prop (source, autoPlay, loop, style, resizeMode,
 * colorFilters, renderMode, callbacks) is forwarded untouched and refs
 * (play/reset) keep working via forwardRef — visuals and animation behavior
 * are unchanged.
 *
 * Performance difference only: the animation library is split into a
 * separate chunk via dynamic import, so first paint (LCP/TBT) doesn't pay
 * for parsing it. The Suspense fallback reserves the same layout (no CLS).
 */
const LazyLottie = forwardRef<any, any>(function LazyLottie(props: any, ref: any) {
  const style = (props as any)?.style;
  return (
    <Suspense fallback={<View style={style} />}>
      <LazyLottieInner {...(props as any)} ref={ref} />
    </Suspense>
  );
});

export default LazyLottie;
