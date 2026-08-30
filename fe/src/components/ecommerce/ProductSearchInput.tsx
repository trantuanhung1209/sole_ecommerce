import { FormEvent, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useProductSearch } from "@/hooks/useProductSearch";
import { cn } from "@/lib/utils";

type ProductSearchInputProps = {
  className?: string;
};

export function ProductSearchInput({ className }: ProductSearchInputProps) {
  const { search, applySearch, clearSearch } = useProductSearch();
  const [query, setQuery] = useState(search);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  useEffect(() => {
    if (debouncedQuery !== search) {
      applySearch(debouncedQuery);
    }
  }, [applySearch, debouncedQuery, search]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    applySearch(query);
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
  };

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Lọc sản phẩm trong danh sách..."
        className="h-11 rounded-lg border-[#E5E7EB] bg-white pl-9 pr-9 text-sm shadow-none transition focus-visible:border-accent/40 focus-visible:ring-accent/20"
      />
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#E5E7EB] hover:text-[#111111]"
          aria-label="Xóa bộ lọc tìm kiếm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </form>
  );
}
