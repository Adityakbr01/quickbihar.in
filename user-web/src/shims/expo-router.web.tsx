import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation, Link as RRLink, Navigate } from 'react-router-dom';

function cleanWebPath(url: any): string {
  if (!url) return '/';
  let path = typeof url === 'string' ? url : url?.pathname || '/';
  const params =
    typeof url === 'object' && url?.params && typeof url.params === 'object'
      ? { ...url.params }
      : null;
  // Substitute dynamic segments like /jewelery/product/[id] (expo-router
  // style) with actual values so react-router matches a real route instead
  // of bouncing to the catch-all. Leftover params become a query string.
  if (params) {
    path = path.replace(/\[([^\]/]+)\]/g, (_m: string, key: string) => {
      if (params[key] !== undefined && params[key] !== null) {
        const value = String(params[key]);
        delete params[key];
        return encodeURIComponent(value);
      }
      return _m;
    });
  }
  const remaining = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
      )
    : null;
  const query =
    remaining && Object.keys(remaining).length
      ? '?' + new URLSearchParams(remaining as Record<string, string>).toString()
      : '';
  path = path.replace(/\/\([^)]+\)/g, '').replace(/^\([^)]+\)/g, '');
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path + query;
}

export function useRouter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  return {
    push: (url: any) => {
      navigate(cleanWebPath(url));
    },
    replace: (url: any) => {
      navigate(cleanWebPath(url), { replace: true });
    },
    back: () => navigate(-1),
    canGoBack: () => true,
    dismiss: () => navigate(-1),
    dismissAll: () => navigate('/'),
    navigate: (url: any) => {
      navigate(cleanWebPath(url));
    },
    setParams: (newParams: Record<string, any>) => {
      const current = Object.fromEntries(searchParams.entries());
      setSearchParams({ ...current, ...newParams });
    },
  };
}

export const router = {
  push: (url: any) => {
    if (typeof window !== 'undefined') {
      window.location.href = cleanWebPath(url);
    }
  },
  replace: (url: any) => {
    if (typeof window !== 'undefined') {
      window.location.replace(cleanWebPath(url));
    }
  },
  back: () => {
    if (typeof window !== 'undefined') window.history.back();
  },
  canGoBack: () => true,
  navigate: (url: any) => {
    if (typeof window !== 'undefined') {
      window.location.href = cleanWebPath(url);
    }
  },
};

export function useFocusEffect(effect: () => void | (() => void)) {
  useEffect(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);
}

export function useLocalSearchParams<T extends Record<string, string> = Record<string, string>>(): T {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  return { ...params, ...query } as T;
}

export function useGlobalSearchParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useLocalSearchParams<T>();
}

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useSegments(): string[] {
  const location = useLocation();
  return location.pathname.split('/').filter(Boolean);
}

export const Link: React.FC<any> = ({ href, children, style, onClick, replace, asChild, ...props }) => {
  const targetTo = cleanWebPath(href);
  
  if (asChild && React.isValidElement(children)) {
    const childProps = (children as any).props || {};
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        if (childProps.onClick) childProps.onClick(e);
        if (onClick) onClick(e);
      },
      ...props,
    } as any);
  }

  return (
    <RRLink
      to={targetTo}
      replace={replace}
      style={typeof style === 'object' ? style : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </RRLink>
  );
};

export const Stack: React.FC<any> & { Screen: React.FC<any> } = ({ children }) => <>{children}</>;
Stack.Screen = () => null;

export const Tabs: React.FC<any> & { Screen: React.FC<any> } = ({ children }) => <>{children}</>;
Tabs.Screen = () => null;

export const Slot: React.FC<any> = ({ children }) => <>{children}</>;

export const Redirect: React.FC<{ href: string }> = ({ href }) => <Navigate to={cleanWebPath(href)} replace />;

export const withLayoutContext = (Nav: any) => Nav;

export const Head: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default {
  useRouter,
  router,
  useFocusEffect,
  useLocalSearchParams,
  useGlobalSearchParams,
  usePathname,
  useSegments,
  Link,
  Stack,
  Tabs,
  Slot,
  Redirect,
  withLayoutContext,
  Head,
};
