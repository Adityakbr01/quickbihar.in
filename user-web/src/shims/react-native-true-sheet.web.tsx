import React from 'react';

export interface TrueSheetMethods {
  present: (_index?: any, _animated?: any) => Promise<void>;
  dismiss: (_animated?: any) => Promise<void>;
  detent: (_index?: any, _animated?: any) => Promise<void>;
  resize: (_height?: any) => Promise<void>;
  dismissStack: (_animated?: any) => Promise<void>;
}

export type TrueSheetProps = any;
export type BackgroundBlur = any;
export type InsetAdjustment = any;
export type ScrollableOptions = any;
export type SheetDetent = any;

export const TrueSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const TrueSheet: React.FC<any> = ({ children, ...props }) => <>{children}</>;

export function useTrueSheet(): { present: () => Promise<void>; dismiss: () => Promise<void>; sheet: { current: any } } {
  return {
    present: async () => {},
    dismiss: async () => {},
    sheet: { current: null },
  };
}

export default {
  TrueSheetProvider,
  TrueSheet,
  useTrueSheet,
};
