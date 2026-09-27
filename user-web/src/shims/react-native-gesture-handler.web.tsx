import React from 'react';

export const GestureHandlerRootView: React.FC<any> = ({ children, style, ...props }) => (
  <div style={style} {...props}>
    {children}
  </div>
);

const createChainableGesture = () => {
  const obj: any = {};
  const methods = [
    'onUpdate', 'onEnd', 'onChange', 'onStart', 'onFinalize',
    'activeOffsetX', 'activeOffsetY', 'failOffsetX', 'failOffsetY',
    'enabled', 'withRef', 'simultaneousWithExternalGesture', 'requireExternalGestureToFail'
  ];
  for (const m of methods) {
    obj[m] = () => obj;
  }
  return obj;
};

export const Gesture = {
  Pan: () => createChainableGesture(),
  Tap: () => createChainableGesture(),
  Native: () => createChainableGesture(),
  Simultaneous: (..._args: any[]) => createChainableGesture(),
  Exclusive: (..._args: any[]) => createChainableGesture(),
};

export const GestureDetector: React.FC<any> = ({ children }) => <>{children}</>;
export const PanGestureHandler: React.FC<any> = ({ children }) => <>{children}</>;

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export default {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
  PanGestureHandler,
  State,
};
