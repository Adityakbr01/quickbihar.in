import React, { useState, useEffect, forwardRef } from 'react';

declare global {
  const __DEV__: boolean;
}

if (typeof (globalThis as any).__DEV__ === 'undefined') {
  (globalThis as any).__DEV__ = true;
}

if (typeof (globalThis as any).require === 'undefined') {
  (globalThis as any).require = (_id: string) => {
    return {};
  };
}

if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = { env: {} };
} else if (!(globalThis as any).process.env) {
  (globalThis as any).process.env = {};
}

// Process style objects and arrays (converting RN styles like flex, paddingVertical to web CSS)
export function processStyle(style: any): React.CSSProperties {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, curr) => ({ ...acc, ...processStyle(curr) }), {});
  }
  if (typeof style !== 'object') return {};

  const processed: Record<string, any> = {};

  for (const key of Object.keys(style)) {
    const val = style[key];
    if (val === undefined || val === null) continue;

    switch (key) {
      case 'paddingVertical':
        processed.paddingTop = val;
        processed.paddingBottom = val;
        break;
      case 'paddingHorizontal':
        processed.paddingLeft = val;
        processed.paddingRight = val;
        break;
      case 'marginVertical':
        processed.marginTop = val;
        processed.marginBottom = val;
        break;
      case 'marginHorizontal':
        processed.marginLeft = val;
        processed.marginRight = val;
        break;
      case 'borderTopRadius':
      case 'borderTopLeftRadius':
        processed.borderTopLeftRadius = val;
        break;
      case 'borderTopRightRadius':
        processed.borderTopRightRadius = val;
        break;
      case 'borderBottomLeftRadius':
        processed.borderBottomLeftRadius = val;
        break;
      case 'borderBottomRightRadius':
        processed.borderBottomRightRadius = val;
        break;
      case 'elevation':
        if (typeof val === 'number' && val > 0) {
          processed.boxShadow = `0px ${val}px ${val * 2}px rgba(0,0,0,${Math.min(0.1 + val * 0.03, 0.4)})`;
        }
        break;
      case 'shadowColor':
      case 'shadowOffset':
      case 'shadowOpacity':
      case 'shadowRadius':
        if (style.shadowColor) {
          const opacity = style.shadowOpacity ?? 0.2;
          const radius = style.shadowRadius ?? 4;
          const { width = 0, height = 2 } = style.shadowOffset || {};
          processed.boxShadow = `${width}px ${height}px ${radius}px rgba(0,0,0,${opacity})`;
        }
        break;
      default:
        processed[key] = val;
    }
  }

  return processed;
}

// Types
export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: any;
  onPress?: (e: any) => void;
  hitSlop?: any;
  layout?: any;
  pointerEvents?: string;
  entering?: any;
  exiting?: any;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: any;
  [key: string]: any;
}

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  style?: any;
  onPress?: (e: any) => void;
  numberOfLines?: number;
  selectable?: boolean;
  ellipsizeMode?: string;
  entering?: any;
  exiting?: any;
  layout?: any;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: any;
  [key: string]: any;
}

export interface PressableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  style?: any;
  children?: any;
  onPress?: (e: any) => void;
  onPressIn?: (e: any) => void;
  onPressOut?: (e: any) => void;
  disabled?: boolean;
  hitSlop?: any;
  android_ripple?: any;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: any;
  [key: string]: any;
}

export interface TouchableOpacityProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: any;
  onPress?: (e: any) => void;
  activeOpacity?: number;
  disabled?: boolean;
  hitSlop?: any;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: any;
  [key: string]: any;
}

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  source?: any;
  style?: any;
  resizeMode?: string;
  alt?: string;
  [key: string]: any;
}

export interface ScrollViewProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: any;
  contentContainerStyle?: any;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: any;
  nestedScrollEnabled?: boolean;
  scrollEventThrottle?: number;
  refreshControl?: any;
  onScroll?: (e: any) => void;
  snapToInterval?: number;
  snapToAlignment?: string;
  decelerationRate?: number | string;
  contentOffset?: { x?: number; y?: number };
  bounces?: boolean;
  scrollEnabled?: boolean;
  pagingEnabled?: boolean;
  stickyHeaderIndices?: number[];
  [key: string]: any;
}

export interface FlatListProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: any[];
  renderItem?: (info: { item: any; index: number; separators: any }) => React.ReactElement | null;
  keyExtractor?: (item: any, index: number) => string;
  ItemSeparatorComponent?: any;
  ListHeaderComponent?: any;
  ListFooterComponent?: any;
  ListEmptyComponent?: any;
  horizontal?: boolean;
  pagingEnabled?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  getItemLayout?: (data: any, index: number) => any;
  onMomentumScrollEnd?: (e: any) => void;
  style?: any;
  contentContainerStyle?: any;
  numColumns?: number;
  columnWrapperStyle?: any;
  scrollEventThrottle?: number;
  decelerationRate?: number | string;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  refreshControl?: any;
  scrollEnabled?: boolean;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  onEndReachedThreshold?: number;
  [key: string]: any;
}

export interface TextInputProps {
  style?: any;
  value?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: any) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  onSubmitEditing?: (e: any) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: string;
  returnKeyType?: string;
  autoCapitalize?: string;
  selectTextOnFocus?: boolean;
  blurOnSubmit?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  [key: string]: any;
}

export type TextInput = any;
export type RNTextInput = any;

// Components
export const View = forwardRef<HTMLDivElement, ViewProps>(({ style, children, onClick, onPress, hitSlop, layout, pointerEvents, entering, exiting, ...props }, ref) => {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'relative',
    borderStyle: 'solid',
    borderWidth: 0,
    minWidth: 0,
    minHeight: 0,
    pointerEvents: pointerEvents as any,
  };
  const combinedStyle = { ...baseStyle, ...processStyle(style) };

  return (
    <div
      ref={ref}
      style={combinedStyle}
      onClick={onPress || onClick}
      {...props}
    >
      {children}
    </div>
  );
});
View.displayName = 'View';

export const Text = forwardRef<HTMLSpanElement, TextProps>(({ style, children, onClick, onPress, numberOfLines, selectable, ellipsizeMode, ...props }, ref) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline',
    boxSizing: 'border-box',
    userSelect: selectable ? 'text' : undefined,
  };
  
  let lineStyle: React.CSSProperties = {};
  if (numberOfLines) {
    lineStyle = {
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };
  }

  const combinedStyle = { ...baseStyle, ...processStyle(style), ...lineStyle };

  return (
    <span
      ref={ref}
      style={combinedStyle}
      onClick={onPress || onClick}
      {...props}
    >
      {children}
    </span>
  );
});
Text.displayName = 'Text';

export const Pressable = forwardRef<HTMLDivElement, PressableProps>(({ style, children, onPress, onPressIn, onPressOut, disabled, onClick, hitSlop, android_ripple, ...props }, ref) => {
  const [pressed, setPressed] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setPressed(true);
    if (onPressIn) onPressIn(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setPressed(false);
    if (onPressOut) onPressOut(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (onPress) onPress(e);
    if (onClick) onClick(e);
  };

  const computedStyle = typeof style === 'function' ? style({ pressed }) : style;
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
  };
  const combinedStyle = { ...baseStyle, ...processStyle(computedStyle) };

  const content = typeof children === 'function' ? children({ pressed }) : children;

  return (
    <div
      ref={ref}
      style={combinedStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      {...props}
    >
      {content}
    </div>
  );
});
Pressable.displayName = 'Pressable';

export const TouchableOpacity = forwardRef<HTMLDivElement, TouchableOpacityProps>(({ style, children, onPress, activeOpacity = 0.7, disabled, onClick, hitSlop, ...props }, ref) => {
  const [pressed, setPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (onPress) onPress(e);
    if (onClick) onClick(e);
  };

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    transition: 'opacity 0.15s ease',
    opacity: disabled ? 0.5 : pressed ? activeOpacity : 1,
  };
  const combinedStyle = { ...baseStyle, ...processStyle(style) };

  return (
    <div
      ref={ref}
      style={combinedStyle}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => !disabled && setPressed(false)}
      onMouseLeave={() => !disabled && setPressed(false)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});
TouchableOpacity.displayName = 'TouchableOpacity';

export const Image = forwardRef<HTMLImageElement, ImageProps>(({ source, style, resizeMode, alt, ...props }, ref) => {
  let src = '';
  if (typeof source === 'string') {
    src = source;
  } else if (source && typeof source === 'object') {
    src = source.uri || source.default || '';
  }

  const baseStyle: React.CSSProperties = {
    display: 'block',
    boxSizing: 'border-box',
    maxWidth: '100%',
    objectFit: resizeMode ? (resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : (resizeMode as any)) : undefined,
  };
  const combinedStyle = { ...baseStyle, ...processStyle(style) };

  return (
    <img
      ref={ref}
      src={src}
      alt={alt || ''}
      style={combinedStyle}
      {...props}
    />
  );
});
Image.displayName = 'Image';

export type ScrollView = any;

export const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(({
  style,
  contentContainerStyle,
  children,
  horizontal,
  showsHorizontalScrollIndicator = true,
  showsVerticalScrollIndicator = true,
  keyboardShouldPersistTaps,
  nestedScrollEnabled,
  scrollEventThrottle,
  refreshControl,
  onScroll,
  ...props
}, ref) => {
  const outerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
    ...(horizontal && !showsHorizontalScrollIndicator ? { scrollbarWidth: 'none' } : {}),
    ...(!horizontal && !showsVerticalScrollIndicator ? { scrollbarWidth: 'none' } : {}),
    ...processStyle(style),
  };

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    boxSizing: 'border-box',
    minWidth: horizontal ? 'max-content' : undefined,
    ...processStyle(contentContainerStyle),
  };

  return (
    <div
      ref={ref}
      style={outerStyle}
      onScroll={onScroll}
      {...props}
    >
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
});
ScrollView.displayName = 'ScrollView';

export type FlatList = any;

export const FlatList = forwardRef<HTMLDivElement, FlatListProps>(({
  data = [],
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  horizontal = false,
  pagingEnabled,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  getItemLayout,
  onMomentumScrollEnd,
  style,
  contentContainerStyle,
  numColumns = 1,
  columnWrapperStyle,
  scrollEventThrottle,
  decelerationRate,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  refreshControl,
  ...props
}, ref) => {
  const outerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    boxSizing: 'border-box',
    ...processStyle(style),
  };

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    boxSizing: 'border-box',
    ...(numColumns > 1 ? { display: 'grid', gridTemplateColumns: `repeat(${numColumns}, 1fr)` } : {}),
    ...processStyle(contentContainerStyle),
  };

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div ref={ref} style={outerStyle} {...props}>
      <div style={innerStyle}>
        {ListHeaderComponent ? (typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent) : null}
        {!hasData && ListEmptyComponent ? (typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent) : null}
        {hasData && data.map((item: any, index: number) => {
          const key = keyExtractor ? keyExtractor(item, index) : item?.id || item?.key || index;
          const element = renderItem ? renderItem({ item, index, separators: {} }) : null;
          const separator = ItemSeparatorComponent && index < data.length - 1 ? (
            typeof ItemSeparatorComponent === 'function' ? <ItemSeparatorComponent key={`sep-${key}`} /> : ItemSeparatorComponent
          ) : null;

          return (
            <React.Fragment key={key}>
              {element}
              {separator}
            </React.Fragment>
          );
        })}
        {ListFooterComponent ? (typeof ListFooterComponent === 'function' ? <ListFooterComponent /> : ListFooterComponent) : null}
      </div>
    </div>
  );
});
FlatList.displayName = 'FlatList';

export const KeyboardAvoidingView = forwardRef<HTMLDivElement, any>(({ children, style, behavior, keyboardVerticalOffset, ...props }, ref) => (
  <View ref={ref} style={style} {...props}>
    {children}
  </View>
));
KeyboardAvoidingView.displayName = 'KeyboardAvoidingView';

export const Switch: React.FC<any> = ({ value, onValueChange, style, disabled, trackColor, thumbColor, ...props }) => (
  <input
    type="checkbox"
    checked={!!value}
    onChange={(e) => onValueChange?.(e.target.checked)}
    disabled={disabled}
    style={{ cursor: 'pointer', ...processStyle(style) }}
    {...props}
  />
);

export const RefreshControl: React.FC<any> = ({ children }) => <>{children}</>;

export const LayoutAnimation = {
  configureNext: (_config?: any, _onAnimationDidEnd?: any) => {},
  create: () => {},
  Types: {},
  Properties: {},
  Presets: {
    easeInEaseOut: {},
    linear: {},
    spring: {},
  },
};

export const UIManager = {
  setLayoutAnimationEnabledExperimental: (_enabled?: boolean) => {},
};

export const TextInput = forwardRef<any, TextInputProps>(({
  style,
  value,
  onChangeText,
  onChange,
  onSubmitEditing,
  placeholder,
  placeholderTextColor,
  secureTextEntry,
  multiline,
  keyboardType,
  returnKeyType,
  autoCapitalize,
  selectTextOnFocus,
  blurOnSubmit,
  editable = true,
  autoFocus,
  ...props
}, ref) => {
  const baseStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    outline: 'none',
    border: '1px solid #ccc',
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '4px',
    fontFamily: 'inherit',
    backgroundColor: editable ? '#fff' : '#f0f0f0',
  };
  const combinedStyle = { ...baseStyle, ...processStyle(style) };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChangeText) onChangeText(e.target.value);
    if (onChange) onChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && onSubmitEditing) {
      onSubmitEditing(e);
    }
  };

  if (multiline) {
    return (
      <textarea
        ref={ref}
        style={combinedStyle}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={!editable}
        autoFocus={autoFocus}
      />
    );
  }

  const type = secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : keyboardType === 'numeric' ? 'number' : 'text';

  return (
    <input
      ref={ref}
      type={type}
      style={combinedStyle}
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={!editable}
      autoFocus={autoFocus}
    />
  );
});
TextInput.displayName = 'TextInput';

export const StyleSheet = {
  create: (styles: any) => styles,
  flatten: (styles: any) => processStyle(styles),
  hairlineWidth: 1,
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

export const Platform = {
  OS: 'web' as 'web' | 'ios' | 'android',
  select: (obj: any) => (obj && 'web' in obj ? obj.web : obj && 'default' in obj ? obj.default : obj),
  isTV: false,
  Version: 1,
};

export const ActivityIndicator: React.FC<any> = ({ color = '#007AFF', size = 'small', style, ...props }) => {
  const pxSize = typeof size === 'number' ? size : size === 'large' ? 36 : 20;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...processStyle(style),
      }}
      {...props}
    >
      <svg
        width={pxSize}
        height={pxSize}
        viewBox="0 0 50 50"
        style={{ animation: 'rn-spin 1s linear infinite' }}
      >
        <style>{`@keyframes rn-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="90 150"
        />
      </svg>
    </div>
  );
};

export const Modal: React.FC<any> = ({ visible = true, transparent, children, onRequestClose, style }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: transparent ? 'rgba(0, 0, 0, 0.5)' : '#ffffff',
        ...processStyle(style),
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onRequestClose) {
          onRequestClose();
        }
      }}
    >
      {children}
    </div>
  );
};

export const StatusBar: React.FC<any> = () => null;

export const BackHandler = {
  addEventListener: (_eventName?: string, _handler?: any) => ({ remove: () => {} }),
  removeEventListener: (_eventName?: string, _handler?: any) => {},
};

const getWindowDimensions = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  height: typeof window !== 'undefined' ? window.innerHeight : 800,
  scale: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  fontScale: 1,
});

export const Dimensions = {
  get: (_dim?: string) => getWindowDimensions(),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
};

export function useWindowDimensions() {
  const [dims, setDims] = useState(getWindowDimensions());

  useEffect(() => {
    const handleResize = () => setDims(getWindowDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dims;
}

export const InteractionManager = {
  runAfterInteractions: (fn: () => void) => {
    const timeout = setTimeout(() => {
      try { fn(); } catch (e) { console.warn(e); }
    }, 0);
    return { cancel: () => clearTimeout(timeout) };
  },
  createInteractionHandle: () => 1,
  clearInteractionHandle: () => {},
};

export const Keyboard = {
  dismiss: () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
  addListener: (_eventName?: string, _callback?: any) => ({ remove: () => {} }),
  removeListener: (_eventName?: string, _callback?: any) => {},
};

export const PanResponder = {
  create: (_config?: any) => ({ panHandlers: {} }),
};

export const Linking = {
  openURL: async (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank');
  },
  canOpenURL: async (_url?: string) => true,
  getInitialURL: async () => (typeof window !== 'undefined' ? window.location.href : null),
  openSettings: async () => {},
  addEventListener: () => ({ remove: () => {} }),
};

export const Alert = {
  alert: (title?: string, message?: string, _buttons?: any[], _options?: any) => {
    if (typeof window !== 'undefined') {
      window.alert([title, message].filter(Boolean).join('\n'));
    }
  },
};

export const Share = {
  share: async (content: any) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      return navigator.share(content);
    }
    Alert.alert('Share', content?.message || content?.url || '');
  },
};

export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setColorScheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setColorScheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  return colorScheme;
};

export const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent: (Comp: any) => Comp,
  loop: (anim: any) => anim,
  Value: class {
    private _val: number;
    constructor(v: number) { this._val = v; }
    setValue(v: number) { this._val = v; }
    interpolate() { return this._val; }
    addListener() { return 'id'; }
    removeListener() {}
  },
  timing: (_value?: any, _config?: any) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  spring: (_value?: any, _config?: any) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  parallel: (_animations?: any[], _config?: any) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  sequence: (_animations?: any[]) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  decay: (_value?: any, _config?: any) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  delay: (_time?: number) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  stagger: (_time?: number, _animations?: any[]) => ({ start: (cb?: any) => cb && cb({ finished: true }) }),
  event: (..._args: any[]) => () => {},
};

export type ViewStyle = React.CSSProperties & Record<string, any>;
export type TextStyle = React.CSSProperties & Record<string, any>;
export type ImageStyle = React.CSSProperties & Record<string, any>;
export type StyleProp<T> = T | T[] | false | null | undefined;
export type ColorValue = string;
export type NativeSyntheticEvent<T> = React.SyntheticEvent<any, T>;
export type NativeScrollEvent = any;
export type LayoutChangeEvent = any;
export type GestureResponderEvent = React.MouseEvent | React.TouchEvent;
export type ImageSourcePropType = any;

export default {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Switch,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  StatusBar,
  BackHandler,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Dimensions,
  useWindowDimensions,
  InteractionManager,
  Keyboard,
  PanResponder,
  Linking,
  Alert,
  Share,
  useColorScheme,
  Animated,
};
