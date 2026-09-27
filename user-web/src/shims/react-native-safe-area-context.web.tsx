import React, { createContext, useContext, forwardRef } from 'react';
import { View, processStyle } from './react-native.web';

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const defaultInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export const SafeAreaInsetsContext = createContext<EdgeInsets>(defaultInsets);

export function useSafeAreaInsets(): EdgeInsets {
  return useContext(SafeAreaInsetsContext) || defaultInsets;
}

export function useSafeAreaFrame() {
  return {
    x: 0,
    y: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  };
}

export const SafeAreaProvider: React.FC<{ children: React.ReactNode; initialMetrics?: any }> = ({ children }) => {
  return (
    <SafeAreaInsetsContext.Provider value={defaultInsets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
};

export const SafeAreaView = forwardRef<HTMLDivElement, any>(({ style, children, ...props }, ref) => {
  return (
    <View ref={ref} style={{ flex: 1, ...processStyle(style) }} {...props}>
      {children}
    </View>
  );
});

SafeAreaView.displayName = 'SafeAreaView';

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
  SafeAreaInsetsContext,
};
