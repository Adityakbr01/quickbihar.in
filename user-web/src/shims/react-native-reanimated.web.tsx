import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView } from './react-native.web';

/**
 * Web equivalent of Reanimated's useReducedMotion: tracks the
 * `prefers-reduced-motion: reduce` media query and updates live.
 */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    // Legacy Safari (< 14).
    (mql as any).addListener?.(onChange);
    return () => (mql as any).removeListener?.(onChange);
  }, []);
  return reduced;
}

export function useSharedValue<T>(initialValue: T) {
  const ref = useRef({ value: initialValue });
  return ref.current;
}

export function useAnimatedStyle<T extends object>(updater: () => T, _deps?: any[]): T {
  try {
    return updater();
  } catch {
    return {} as T;
  }
}

export function useAnimatedProps<T = any>(updater: () => T, _deps?: any[]): any {
  try {
    return updater();
  } catch {
    return {};
  }
}

export function useAnimatedScrollHandler(handler: any, _deps?: any[]): any {
  return (e: any) => {
    if (typeof handler === 'function') handler(e);
    else if (handler && handler.onScroll) handler.onScroll(e);
  };
}

export function runOnJS<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export const Extrapolate = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export function withTiming<T = any>(toValue: T, _userConfig?: any, _callback?: any): T {
  return toValue;
}

export function withSpring<T = any>(toValue: T, _userConfig?: any, _callback?: any): T {
  return toValue;
}

export function withSequence<T = any>(...args: T[]): T {
  return args.length > 0 ? args[args.length - 1] : (0 as any);
}

export function withDelay<T = any>(_delay: number, animation: T): T {
  return animation;
}

export function withRepeat<T = any>(animation: T, _numberOfRepetitions?: number, _reverse?: boolean, _callback?: any): T {
  return animation;
}

export function interpolate(value: number, inputRange: number[], outputRange: (number | string)[], _extrapolate?: any, _extrapolateRight?: any): any {
  if (!inputRange || !outputRange || inputRange.length < 2 || outputRange.length < 2) return outputRange ? outputRange[0] : 0;
  const minInput = inputRange[0];
  const maxInput = inputRange[inputRange.length - 1];
  const progress = Math.min(Math.max((value - minInput) / (maxInput - minInput || 1), 0), 1);
  const minOut = outputRange[0];
  const maxOut = outputRange[outputRange.length - 1];

  if (typeof minOut === 'number' && typeof maxOut === 'number') {
    return minOut + progress * (maxOut - minOut);
  }
  return outputRange[0];
}

export const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent: (Comp: any) => Comp,
};

const dummyAnimation: any = {
  duration: () => dummyAnimation,
  delay: () => dummyAnimation,
  springify: () => dummyAnimation,
  damping: () => dummyAnimation,
  stiffness: () => dummyAnimation,
  withCallback: () => dummyAnimation,
};

export const FadeIn = dummyAnimation;
export const FadeInDown = dummyAnimation;
export const FadeInUp = dummyAnimation;
export const FadeOut = dummyAnimation;
export const FadeOutDown = dummyAnimation;
export const FadeOutUp = dummyAnimation;
export const SlideInDown = dummyAnimation;
export const SlideOutUp = dummyAnimation;
export const Layout = dummyAnimation;
export const LinearTransition = dummyAnimation;

export const Easing = {
  linear: (v?: any) => v,
  ease: (v?: any) => v,
  quad: (v?: any) => v,
  cubic: (v?: any) => v,
  sin: (v?: any) => v,
  poly: (..._args: any[]) => (v?: any) => v,
  bezier: (..._args: any[]) => (v?: any) => v,
  in: (..._args: any[]) => (v?: any) => v,
  out: (..._args: any[]) => (v?: any) => v,
  inOut: (..._args: any[]) => (v?: any) => v,
};

export type SharedValue<T> = { value: T };

export default Animated;
