import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useInRouterContext, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Lenis, { type LenisOptions } from "lenis";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const LENIS_PREVENT_SELECTOR =
  '[data-lenis-prevent], [role="dialog"], .overflow-y-auto, .overflow-auto';

export type SmoothScrollTarget = number | string | HTMLElement;

export type SmoothScrollToOptions = {
  offset?: number;
  immediate?: boolean;
  duration?: number;
};

export type SmoothScrollContextValue = {
  scrollToTop: (options?: SmoothScrollToOptions) => void;
  scrollTo: (target: SmoothScrollTarget, options?: SmoothScrollToOptions) => void;
};

export type LenisLike = {
  raf: (time: number) => void;
  scrollTo: (
    target: number | string | HTMLElement,
    options?: {
      offset?: number;
      immediate?: boolean;
      duration?: number;
    }
  ) => void;
  destroy: () => void;
};

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// eslint-disable-next-line react-refresh/only-export-components
export function shouldPreventLenis(node: HTMLElement): boolean {
  return Boolean(node.closest(LENIS_PREVENT_SELECTOR));
}

function resolveTargetElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target !== "string") {
    return target;
  }
  if (typeof document === "undefined") {
    return null;
  }
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function nativeScrollTo(target: SmoothScrollTarget, options?: SmoothScrollToOptions) {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") {
    return;
  }

  const instant = Boolean(options?.immediate) || getPrefersReducedMotion();
  const behavior: ScrollBehavior = instant ? "auto" : "smooth";
  const offset = options?.offset ?? 0;

  if (typeof target === "number") {
    window.scrollTo({ top: Math.max(0, target + offset), behavior });
    return;
  }

  const element = resolveTargetElement(target);
  if (!element) {
    return;
  }

  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
  window.scrollTo({ top, behavior });
}

type SmoothScrollSessionDeps = {
  createLenis?: (options: LenisOptions) => LenisLike;
  onReducedMotionChange?: (reduced: boolean) => void;
  onInstanceChange?: (instance: LenisLike | null) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export function createSmoothScrollSession(deps: SmoothScrollSessionDeps = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const createLenis = deps.createLenis ?? ((options: LenisOptions) => new Lenis(options));
  let lenis: LenisLike | null = null;
  let rafId = 0;

  const stopLenis = () => {
    if (rafId && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (lenis) {
      lenis.destroy();
      lenis = null;
      deps.onInstanceChange?.(null);
    }
  };

  const startLenis = () => {
    if (lenis) return;
    lenis = createLenis({
      lerp: 0.1,
      smoothWheel: true,
      prevent: shouldPreventLenis,
    });
    deps.onInstanceChange?.(lenis);

    if (typeof window.requestAnimationFrame === "function") {
      const raf = (time: number) => {
        if (!lenis) return;
        lenis.raf(time);
        rafId = window.requestAnimationFrame(raf);
      };
      rafId = window.requestAnimationFrame(raf);
    }
  };

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia(REDUCED_MOTION_QUERY)
      : null;

  const applyReducedMotion = (reduced: boolean) => {
    deps.onReducedMotionChange?.(reduced);
    if (reduced) {
      stopLenis();
    } else {
      startLenis();
    }
  };

  applyReducedMotion(Boolean(mediaQuery?.matches));

  const handleChange = (event: MediaQueryListEvent) => {
    applyReducedMotion(event.matches);
  };

  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
    }
  }

  return () => {
    if (mediaQuery) {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleChange);
      }
    }
    stopLenis();
  };
}

const fallbackContextValue: SmoothScrollContextValue = {
  scrollToTop: (options) => nativeScrollTo(0, options),
  scrollTo: (target, options) => nativeScrollTo(target, options),
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>(fallbackContextValue);

function findHashTarget(hash: string): HTMLElement | null {
  if (!hash || typeof document === "undefined") {
    return null;
  }
  const rawId = hash.startsWith("#") ? hash.slice(1) : hash;
  if (rawId) {
    try {
      const byDecodedId = document.getElementById(decodeURIComponent(rawId));
      if (byDecodedId) return byDecodedId;
    } catch {
      const byRawId = document.getElementById(rawId);
      if (byRawId) return byRawId;
    }
  }
  return resolveTargetElement(hash);
}

type RouteScrollSyncProps = {
  lenisRef: RefObject<LenisLike | null>;
  prefersReducedMotion: boolean;
};

function RouteScrollSync({ lenisRef, prefersReducedMotion }: RouteScrollSyncProps) {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (location.hash) {
      const rafId = window.requestAnimationFrame(() => {
        const target = findHashTarget(location.hash);
        if (!target) return;

        const lenis = lenisRef.current;
        if (lenis && !prefersReducedMotion) {
          lenis.scrollTo(target, { immediate: false });
        } else {
          nativeScrollTo(target, { immediate: prefersReducedMotion });
        }
      });
      previousPathnameRef.current = location.pathname;
      return () => window.cancelAnimationFrame(rafId);
    }

    if (previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      const lenis = lenisRef.current;
      if (lenis && !prefersReducedMotion) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        nativeScrollTo(0, { immediate: true });
      }
    }
  }, [location.pathname, location.hash, lenisRef, prefersReducedMotion]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisLike | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    getPrefersReducedMotion
  );
  const inRouter = useInRouterContext();

  useEffect(() => {
    return createSmoothScrollSession({
      onReducedMotionChange: setPrefersReducedMotion,
      onInstanceChange: (instance) => {
        lenisRef.current = instance;
      },
    });
  }, []);

  const scrollTo = useCallback(
    (target: SmoothScrollTarget, options?: SmoothScrollToOptions) => {
      const lenis = lenisRef.current;
      if (lenis && !prefersReducedMotion) {
        lenis.scrollTo(target, {
          offset: options?.offset,
          immediate: options?.immediate ?? false,
          duration: options?.duration,
        });
        return;
      }
      nativeScrollTo(target, {
        ...options,
        immediate: prefersReducedMotion || options?.immediate,
      });
    },
    [prefersReducedMotion]
  );

  const scrollToTop = useCallback(
    (options?: SmoothScrollToOptions) => {
      scrollTo(0, options);
    },
    [scrollTo]
  );

  const value = useMemo<SmoothScrollContextValue>(
    () => ({ scrollToTop, scrollTo }),
    [scrollToTop, scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      <MotionConfig reducedMotion="user">
        {inRouter ? (
          <RouteScrollSync lenisRef={lenisRef} prefersReducedMotion={prefersReducedMotion} />
        ) : null}
        {children}
      </MotionConfig>
    </SmoothScrollContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSmoothScroll(): SmoothScrollContextValue {
  return useContext(SmoothScrollContext);
}
