import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * SPA scroll restoration (react-router v7 is used with <BrowserRouter>,
 * so the data-router <ScrollRestoration /> component is not available).
 *
 * - PUSH / REPLACE navigation: jump to the top of the new route.
 * - POP navigation (browser Back / Forward): restore the scroll offset the
 *   history entry had when the user left it.
 * - In-page state updates: the location key does not change, so nothing
 *   scrolls.
 *
 * Offsets are keyed by location.key in sessionStorage and the restore
 * retries briefly so asynchronously rendered content (product grids that
 * re-fetch on back) can grow the page tall enough for the target offset.
 */
const STORAGE_KEY = "qb:web:scroll-positions";
const MAX_ENTRIES = 60;
const RESTORE_TRIES = 25;
const RESTORE_INTERVAL_MS = 80;

type ScrollStore = Record<string, number>;

function readStore(): ScrollStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScrollStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScrollStore): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* Private mode / quota — scroll restoration is best-effort. */
  }
}

export default function ScrollRestorationManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (navigationType === "POP") {
      const target = readStore()[location.key];
      if (typeof target !== "number" || target <= 0) return;

      let cancelled = false;
      let tries = 0;

      const attempt = () => {
        if (cancelled) return;
        window.scrollTo(0, target);
        const reached = Math.abs((window.scrollY ?? 0) - target) < 4;
        if (!reached && tries < RESTORE_TRIES) {
          tries += 1;
          window.setTimeout(attempt, RESTORE_INTERVAL_MS);
        }
      };

      attempt();

      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined" && document.body) {
        observer = new ResizeObserver(() => {
          if (!cancelled) attempt();
        });
        observer.observe(document.body);
      }

      return () => {
        cancelled = true;
        if (observer) observer.disconnect();
      };
    }

    // Fresh navigation — always start at the top.
    window.scrollTo(0, 0);
    return undefined;
  }, [location.key, navigationType]);

  useEffect(() => {
    const save = () => {
      const store = readStore();
      store[location.key] = window.scrollY ?? 0;
      const keys = Object.keys(store);
      if (keys.length > MAX_ENTRIES) {
        for (const stale of keys.slice(0, keys.length - MAX_ENTRIES)) {
          delete store[stale];
        }
      }
      writeStore(store);
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => {
      window.removeEventListener("scroll", save);
      save();
    };
  }, [location.key]);

  return null;
}
