import { type FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

const CRISP_EASE = [0.22, 1, 0.36, 1] as const;

type ProductSearchInputProps = {
  className?: string;
  onSearchSubmit?: (query: string) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export function submitProductSearch(options: {
  query: string;
  applySearch: (value: string) => void;
  onSearchSubmit?: (query: string) => void;
  onListingPage: boolean;
  scrollTo: (target: string, scrollOptions?: { offset?: number }) => void;
}) {
  options.applySearch(options.query);
  if (options.onSearchSubmit) {
    options.onSearchSubmit(options.query);
  } else if (options.onListingPage) {
    options.scrollTo("#catalog-results", { offset: -96 });
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function shouldApplyDebouncedSearch(options: {
  debouncedQuery: string;
  query: string;
  search: string;
}): boolean {
  return (
    options.debouncedQuery === options.query &&
    options.debouncedQuery.trim() !== options.search.trim()
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function syncDebouncedProductSearch(options: {
  prevDebouncedQuery: string;
  debouncedQuery: string;
  query: string;
  search: string;
  applySearch: (value: string) => void;
}): string {
  if (options.prevDebouncedQuery === options.debouncedQuery) {
    return options.prevDebouncedQuery;
  }

  if (
    shouldApplyDebouncedSearch({
      debouncedQuery: options.debouncedQuery,
      query: options.query,
      search: options.search,
    })
  ) {
    options.applySearch(options.debouncedQuery);
  }

  return options.debouncedQuery;
}

export function ProductSearchInput({ className, onSearchSubmit }: ProductSearchInputProps) {
  const { search, onListingPage, applySearch, clearSearch } = useProductSearch();
  const { scrollTo } = useSmoothScroll();
  const shouldReduceMotion = useReducedMotion();
  const [query, setQuery] = useState(search);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const prevDebouncedQueryRef = useRef(debouncedQuery);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  useEffect(() => {
    prevDebouncedQueryRef.current = syncDebouncedProductSearch({
      prevDebouncedQuery: prevDebouncedQueryRef.current,
      debouncedQuery,
      query,
      search,
      applySearch,
    });
  }, [applySearch, debouncedQuery, query, search]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    submitProductSearch({
      query,
      applySearch,
      onSearchSubmit,
      onListingPage,
      scrollTo,
    });
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
  };

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)} role="search">
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-150",
          isFocused ? "text-[#111111]" : "text-[#9CA3AF]"
        )}
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Tìm kiếm sản phẩm"
        placeholder="Lọc sản phẩm trong danh sách..."
        className="h-11 rounded-lg border-[#E5E7EB] bg-white pl-9 pr-10 text-sm shadow-none transition-[border-color,box-shadow] duration-150 focus-visible:border-accent/40 focus-visible:ring-accent/20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <AnimatePresence initial={false}>
          {query ? (
            <motion.button
              key="clear-search"
              type="button"
              onClick={handleClear}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.16,
                ease: CRISP_EASE,
              }}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#E5E7EB] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/25"
              aria-label="Xóa bộ lọc tìm kiếm"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
