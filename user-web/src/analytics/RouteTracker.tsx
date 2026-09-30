/**
 * @file src/analytics/RouteTracker.tsx
 * SPA page-view tracker for GA4. Mount ONCE inside <BrowserRouter>.
 *
 * Sends a sanitized `page_view` (see googleAnalytics.sanitizePageUrl) on
 * every route change, including the initial load. Automatic gtag page_view
 * is disabled at config time, so this is the single source of page views —
 * no duplicates.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./googleAnalytics";

export default function RouteTracker() {
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    // Skip consecutive duplicates (e.g. React 19 StrictMode double-effect
    // in dev replays the same location twice).
    if (lastTracked.current === key) return;
    lastTracked.current = key;
    trackPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}
