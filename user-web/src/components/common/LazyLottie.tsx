import React, { Suspense, forwardRef } from "react";
import { View } from "react-native";

const LottieInner = React.lazy(() =>
  import("lottie-react").then((m) => ({ default: m.Lottie }))
);

/**
 * Lottie player (web: `lottie-react`, lazy-loaded).
 *
 * Accepts the old lottie-react-native prop shape used across the app
 * (`source`, `autoPlay`, `loop`, `style`, `resizeMode`) and maps it to
 * lottie-react v3 (`src`, `autoplay`). The animation library stays
 * in a separate chunk via dynamic import, so first paint (LCP/TBT)
 * doesn't pay for parsing it. The Suspense fallback reserves the same
 * layout (no CLS).
 */
const LazyLottie = forwardRef<any, any>(function LazyLottie(props: any, ref: any) {
  const { source, autoPlay, autoplay, loop, resizeMode: _resizeMode, style, ..._rest } = props ?? {};
  const cssStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  return (
    <Suspense fallback={<View style={style} />}>
      <LottieInner
        src={source}
        autoplay={autoplay ?? autoPlay ?? true}
        loop={loop ?? true}
        style={cssStyle}
        ref={ref}
      />
    </Suspense>
  );
});

export default LazyLottie;
