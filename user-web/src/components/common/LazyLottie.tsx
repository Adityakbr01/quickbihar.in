import React, {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const LottieInner = React.lazy(() =>
  import("lottie-react").then((m) => ({ default: m.Lottie }))
);

interface LottieInstance {
  play?: () => void;
  pause?: () => void;
}

/**
 * Lottie player (web: `lottie-react`, lazy-loaded).
 *
 * Accepts the old lottie-react-native prop shape used across the app
 * (`source`, `autoPlay`, `loop`, `style`, `resizeMode`) and maps it to
 * lottie-react v3 (`src`, `autoplay`). The animation library stays
 * in a separate chunk via dynamic import, so first paint (LCP/TBT)
 * doesn't pay for parsing it. The Suspense fallback reserves the same
 * layout (no CLS).
 *
 * Battery/jank guard: lottie SVG re-renders every frame on the main
 * thread. Each instance auto-pauses when it scrolls out of view
 * (IntersectionObserver) and while ANY AppSheet is open
 * (`qb-sheet-open` / `qb-sheet-close` window events) — e.g. feed
 * animations freeze during the 300ms sheet slide instead of fighting
 * it for frames. Playback resumes automatically afterwards.
 */
const LazyLottie = forwardRef<any, any>(function LazyLottie(props: any, ref: any) {
  const { source, autoPlay, autoplay, loop, resizeMode: _resizeMode, style, deferOffscreen, renderer, ..._rest } = props ?? {};
  const wantPlay = autoplay ?? autoPlay ?? true;
  // Viewport-gated loading (opt-in): the lottie-react engine (~323 KB) is
  // only downloaded once the placeholder scrolls into view. Below-fold
  // decorative instances use this so first paint never pays for them; the
  // placeholder keeps identical layout (no CLS). Design is unchanged —
  // the animation still plays on scroll into view.
  const [gatedInView, setGatedInView] = useState(!deferOffscreen);
  const gateIoRef = useRef<IntersectionObserver | null>(null);
  const gateRef = useCallback((node: HTMLDivElement | null) => {
    gateIoRef.current?.disconnect();
    gateIoRef.current = null;
    if (!deferOffscreen) return;
    if (!node || gatedInView) return;
    if (typeof IntersectionObserver === "undefined") {
      setGatedInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setGatedInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "200px" },
    );
    io.observe(node);
    gateIoRef.current = io;
  }, [deferOffscreen, gatedInView]);
  useEffect(() => () => gateIoRef.current?.disconnect(), []);
  const cssStyle: React.CSSProperties | undefined = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style;

  const instanceRef = useRef<LottieInstance | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const inViewRef = useRef(true);
  const sheetsOpenRef = useRef(0);

  const syncPlayback = useCallback(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    if (wantPlay && inViewRef.current && sheetsOpenRef.current === 0) {
      inst.play?.();
    } else {
      inst.pause?.();
    }
  }, [wantPlay]);

  // Pause while any bottom sheet is open (nested sheets stack via counter).
  useEffect(() => {
    const onSheetOpen = () => {
      sheetsOpenRef.current += 1;
      syncPlayback();
    };
    const onSheetClose = () => {
      sheetsOpenRef.current = Math.max(0, sheetsOpenRef.current - 1);
      syncPlayback();
    };
    window.addEventListener("qb-sheet-open", onSheetOpen);
    window.addEventListener("qb-sheet-close", onSheetClose);
    return () => {
      window.removeEventListener("qb-sheet-open", onSheetOpen);
      window.removeEventListener("qb-sheet-close", onSheetClose);
    };
  }, [syncPlayback]);

  // Pause when scrolled out of view. Cleanup on unmount.
  useEffect(() => () => ioRef.current?.disconnect(), []);

  const setHost = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as { current: unknown }).current = node;
      }
      ioRef.current?.disconnect();
      ioRef.current = null;
      if (node && typeof IntersectionObserver !== "undefined") {
        inViewRef.current = true;
        const io = new IntersectionObserver(
          (entries) => {
            inViewRef.current = entries[0]?.isIntersecting ?? true;
            syncPlayback();
          },
          { threshold: 0 },
        );
        io.observe(node);
        ioRef.current = io;
      }
    },
    [ref, syncPlayback],
  );

  const setInstance = useCallback(
    (inst: LottieInstance | null) => {
      instanceRef.current = inst;
      syncPlayback();
    },
    [syncPlayback],
  );

  if (deferOffscreen && !gatedInView) {
    return <div ref={gateRef} style={cssStyle} aria-hidden="true" />;
  }

  return (
    <Suspense fallback={<div style={cssStyle} />}>
      <LottieInner
        src={source}
        autoplay={wantPlay}
        loop={loop ?? true}
        style={cssStyle}
        ref={setHost}
        lottieRef={setInstance}
        renderer={renderer ?? "svg"}
      />
    </Suspense>
  );
});

export default LazyLottie;
