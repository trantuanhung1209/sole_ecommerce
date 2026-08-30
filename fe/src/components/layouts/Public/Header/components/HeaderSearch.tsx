import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { money, productApi } from "@/services/ecommerceServices";
import type { ProductSummary } from "@/types/ecommerce.type";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80";

type HeaderSearchProps = {
  className?: string;
  onNavigate?: () => void;
};

export function HeaderSearch({ className, onNavigate }: HeaderSearchProps) {
  const navigate = useNavigate();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    productApi
      .list({ search: trimmed, page: 0, pageSize: 6 })
      .then((result) => {
        if (!cancelled) setSuggestions(result.content);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToProduct = (product: ProductSummary) => {
    setOpen(false);
    setQuery("");
    setSuggestions([]);
    onNavigate?.();
    navigate(`/products/${product.slug || product.productId}`);
  };

  const goToAllResults = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    onNavigate?.();
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (suggestions.length === 1) {
      goToProduct(suggestions[0]);
      return;
    }
    goToAllResults();
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Tìm giày, thương hiệu..."
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="h-9 rounded-full border-[#E5E7EB] bg-[#F7F7F5] pl-9 pr-9 text-sm shadow-none transition focus-visible:border-accent/40 focus-visible:bg-white focus-visible:ring-accent/20 md:h-11 md:pl-10 md:pr-10"
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#E5E7EB] hover:text-[#111111]"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-[#6B7280]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm...
            </div>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#6B7280]">Không có gợi ý phù hợp</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {suggestions.map((product) => (
                <li key={product.productId}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[#F7F7F5]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToProduct(product)}
                  >
                    <img
                      src={product.imageUrls?.[0] || PLACEHOLDER}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] object-contain p-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{product.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#6B7280]">
                        {product.brandName || "SOLE"} · {money(product.minPrice ?? 0)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() ? (
            <button
              type="button"
              className="w-full border-t border-[#F1F1EF] px-4 py-3 text-left text-sm font-semibold text-[#E53935] transition hover:bg-[#F7F7F5]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={goToAllResults}
            >
              Xem tất cả kết quả cho "{query.trim()}"
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
