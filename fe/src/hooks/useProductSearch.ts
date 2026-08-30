import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

function isProductListingPath(pathname: string) {
  return pathname === "/products" || pathname.startsWith("/categories/");
}

export function useProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const onListingPage = isProductListingPath(location.pathname);
  const search = searchParams.get("search") || "";

  const applySearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (onListingPage) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) next.set("search", trimmed);
        else next.delete("search");
        next.delete("page");
        setSearchParams(next);
        return;
      }

      const next = new URLSearchParams();
      if (trimmed) next.set("search", trimmed);
      navigate(next.toString() ? `/products?${next.toString()}` : "/products");
    },
    [navigate, onListingPage, searchParams, setSearchParams]
  );

  const clearSearch = useCallback(() => {
    applySearch("");
  }, [applySearch]);

  return {
    search,
    onListingPage,
    applySearch,
    clearSearch,
  };
}

export { isProductListingPath };
