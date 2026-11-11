export const ADMIN_PAGE_SIZE = 8;
export const ADMIN_PAGE_SIZE_OPTIONS = [8, 16, 24] as const;

export interface PaginatedResult<T> {
  content: T[];
  page: number;
  totalPages: number;
  totalElements: number;
}

/** Clamp a zero-based page index within valid bounds [0, Math.max(0, totalPages - 1)]. */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.max(0, Math.min(page, totalPages - 1));
}

/** Slice an in-memory array into a deterministic page with safe page clamping. */
export function paginateSlice<T>(
  items: T[],
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE
): PaginatedResult<T> {
  const safeSize = Math.max(1, pageSize);
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / safeSize);
  const safePage = clampPage(page, totalPages);
  const start = safePage * safeSize;
  return {
    content: items.slice(start, start + safeSize),
    page: safePage,
    totalPages,
    totalElements,
  };
}

/** Smoothly scroll both window/Lenis and the portal's scrollable main container to top. */
export function scrollPortalToTop(scrollToTop?: () => void): void {
  scrollToTop?.();
  if (typeof document === "undefined") return;
  const main = document.querySelector<HTMLElement>('[data-scroll-container="portal-main"]');
  if (main && typeof main.scrollTo === "function") {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    main.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
}
