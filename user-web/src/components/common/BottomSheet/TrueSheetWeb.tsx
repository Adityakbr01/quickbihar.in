import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Drawer } from 'vaul';

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

/**
 * Bottom sheet backed by vaul (the shadcn Drawer primitive —
 * transform-only animations, no extra animation runtime).
 *
 * Sheets stay closed until `present()` is called and render as a
 * proper drag-to-dismiss bottom drawer.
 */
export const TrueSheet = forwardRef<TrueSheetMethods, any>(function TrueSheet(
  {
    children,
    onDidDismiss,
    backgroundColor,
    dismissible = true,
  }: {
    children?: React.ReactNode;
    onDidDismiss?: () => void;
    backgroundColor?: string;
    dismissible?: boolean;
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  // Guards onDidDismiss so it fires exactly once per close (programmatic
  // dismiss on an already-closed sheet is a no-op, never a loop).
  const openRef = useRef(false);

  const fireDidDismiss = () => {
    if (openRef.current) {
      openRef.current = false;
      try {
        onDidDismiss?.();
      } catch {}
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      present: async () => {
        openRef.current = true;
        setOpen(true);
      },
      dismiss: async () => {
        setOpen(false);
        fireDidDismiss();
      },
      detent: async () => {},
      resize: async () => {},
      dismissStack: async () => {
        setOpen(false);
        fireDidDismiss();
      },
    }),
    [onDidDismiss],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) fireDidDismiss();
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={dismissible !== false}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99990,
          }}
        />
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 99991,
            backgroundColor: backgroundColor || '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
          }}
        >
          {/* Grabber */}
          <div
            style={{
              padding: '12px 0 4px',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

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
