import React, { useEffect, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

/**
 * Web implementation of `react-native-reanimated-carousel` backed by
 * Embla Carousel (already a project dependency: embla-carousel-react +
 * embla-carousel-autoplay).
 *
 * Previously this was a plain horizontal ScrollView, so on web every
 * slider degraded: no autoplay, no looping, no snap, and callbacks like
 * `onSnapToItem` / `onProgressChange` never fired (dots, counters and
 * dash indicators stayed frozen).
 *
 * Mobile is untouched — this file only ships on web (vite `.web.tsx`
 * alias). The prop surface mirrors the native library subset used across
 * the app (TopHomeCarousel banners, HeroCarousel, product gallery,
 * mall hero): data, renderItem, width/height, loop, autoPlay,
 * autoPlayInterval, defaultIndex, scrollAnimationDuration,
 * onSnapToItem, onProgressChange. Native-only props (mode, modeConfig,
 * onConfigurePanGesture, …) are accepted and ignored.
 */
export function Carousel<T = any>({
  data = [],
  renderItem,
  width,
  height,
  loop = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  defaultIndex = 0,
  scrollAnimationDuration,
  vertical = false,
  onSnapToItem,
  onProgressChange,
  style,
}: any): React.ReactElement {
  const canSlide = Array.isArray(data) && data.length > 1;

  const plugins = useMemo(
    () =>
      autoPlay && canSlide
        ? [
            Autoplay({
              delay: Math.max(1000, autoPlayInterval || 3000),
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]
        : [],
    [autoPlay, autoPlayInterval, canSlide],
  );

  const [viewportRef, emblaApi] = useEmblaCarousel(
    {
      loop: !!loop && canSlide,
      axis: vertical ? 'y' : 'x',
      // embla `duration` is ~frames at 60fps; map the native ms value.
      duration:
        typeof scrollAnimationDuration === 'number'
          ? Math.max(10, Math.min(60, Math.round(scrollAnimationDuration / 15)))
          : 25,
      skipSnaps: false,
      dragFree: false,
    },
    plugins,
  );

  // Forward selection to native-style callbacks (dots, counters, indicators).
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      try {
        onSnapToItem?.(index);
      } catch {}
      try {
        // Native signature: onProgressChange(_, absoluteProgress).
        onProgressChange?.(0, index);
      } catch {}
    };
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSnapToItem, onProgressChange]);

  // Async data (banners load after mount) changes the slide count —
  // re-init so snap points stay correct.
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, Array.isArray(data) ? data.length : 0]);

  // Honor a non-zero start index once the engine is ready.
  useEffect(() => {
    if (emblaApi && defaultIndex > 0) {
      emblaApi.scrollTo(defaultIndex, true);
    }
  }, [emblaApi, defaultIndex]);

  const viewportStyle: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? 'auto',
    overflow: 'hidden',
    ...((style as React.CSSProperties) || {}),
  };

  return (
    <div ref={viewportRef} style={viewportStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          height: '100%',
          // Let vertical page scroll pass through; Embla owns horizontal.
          touchAction: vertical ? 'pan-x' : 'pan-y',
        }}
      >
        {(Array.isArray(data) ? data : []).map((item: any, index: number) => (
          <div
            key={item?.id ?? item?._id ?? item?.key ?? index}
            style={{
              flex: '0 0 100%',
              minWidth: 0,
              width: width ?? '100%',
            }}
          >
            {renderItem ? renderItem({ item, index }) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
