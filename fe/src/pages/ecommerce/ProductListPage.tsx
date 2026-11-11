import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/home/ProductCard";
import { ProductSearchInput } from "@/components/ecommerce/ProductSearchInput";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TablePagination } from "@/components/shared/TablePagination";
import { cn } from "@/lib/utils";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { brandApi, categoryApi, money, productApi, type ProductFilterParams } from "@/services/ecommerceServices";
import type { Brand, Category, ProductSummary } from "@/types/ecommerce.type";

export const CATALOG_PAGE_SIZE = 6;
const PAGE_SIZE = CATALOG_PAGE_SIZE;
const CRISP_EASE = [0.22, 1, 0.36, 1] as const;

export const CATALOG_RESULTS_SELECTOR = "#catalog-results";
export const CATALOG_SCROLL_OFFSET = -96;

const GENDER_LABELS: Record<string, string> = {
  MEN: "Nam",
  WOMEN: "Nữ",
  UNISEX: "Unisex",
  KIDS: "Trẻ em",
};

const SORT_LABELS: Record<string, string> = {
  newest: "Mới nhất",
  price_asc: "Giá tăng dần",
  price_desc: "Giá giảm dần",
  rating: "Đánh giá cao",
};

export type CatalogDraftFilters = {
  brandId: string;
  categoryId: string;
  gender: string;
  minPrice: string;
  maxPrice: string;
  size: string;
  color: string;
  inStock: boolean;
  sort: string;
};

export type ActiveFilterChipKey =
  | "search"
  | "brandId"
  | "categoryId"
  | "gender"
  | "price"
  | "size"
  | "color"
  | "inStock"
  | "sort";

export type ActiveFilterChip = {
  key: ActiveFilterChipKey;
  label: string;
  removeParams: string[];
};

type ProductListPageProps = {
  presetCategoryId?: string;
  presetSort?: string;
  title?: string;
  subtitle?: string;
};

const emptyDraft: CatalogDraftFilters = {
  brandId: "",
  categoryId: "",
  gender: "",
  minPrice: "",
  maxPrice: "",
  size: "",
  color: "",
  inStock: false,
  sort: "newest",
};

function draftFromParams(searchParams: URLSearchParams, presetSort?: string): CatalogDraftFilters {
  return {
    brandId: searchParams.get("brandId") || "",
    categoryId: searchParams.get("categoryId") || "",
    gender: searchParams.get("gender") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    inStock: searchParams.get("inStock") === "true",
    sort: searchParams.get("sort") || presetSort || "newest",
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildActiveFilterChips(
  filters: ProductFilterParams,
  context: {
    brands: Brand[];
    categories: Category[];
    presetCategoryId?: string;
    presetSort?: string;
  }
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.search) {
    chips.push({
      key: "search",
      label: `Từ khóa: "${filters.search}"`,
      removeParams: ["search"],
    });
  }

  if (filters.brandId) {
    const brandName =
      context.brands.find((brand) => brand.brandId === filters.brandId)?.name ?? filters.brandId;
    chips.push({
      key: "brandId",
      label: `Thương hiệu: ${brandName}`,
      removeParams: ["brandId"],
    });
  }

  if (!context.presetCategoryId && filters.categoryId) {
    const categoryName =
      context.categories.find((cat) => cat.categoryId === filters.categoryId)?.name ??
      filters.categoryId;
    chips.push({
      key: "categoryId",
      label: `Danh mục: ${categoryName}`,
      removeParams: ["categoryId"],
    });
  }

  if (filters.gender) {
    chips.push({
      key: "gender",
      label: `Giới tính: ${GENDER_LABELS[filters.gender] ?? filters.gender}`,
      removeParams: ["gender"],
    });
  }

  const hasMinPrice = typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice);
  const hasMaxPrice = typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice);

  if (hasMinPrice || hasMaxPrice) {
    const priceLabel =
      hasMinPrice && hasMaxPrice
        ? `Giá: ${money(filters.minPrice!)} – ${money(filters.maxPrice!)}`
        : hasMinPrice
          ? `Giá từ ${money(filters.minPrice!)}`
          : `Giá đến ${money(filters.maxPrice!)}`;
    chips.push({
      key: "price",
      label: priceLabel,
      removeParams: ["minPrice", "maxPrice"],
    });
  }

  if (filters.variantSize) {
    chips.push({
      key: "size",
      label: `Size: ${filters.variantSize}`,
      removeParams: ["size"],
    });
  }

  if (filters.color) {
    chips.push({
      key: "color",
      label: `Màu: ${filters.color}`,
      removeParams: ["color"],
    });
  }

  if (filters.inStock) {
    chips.push({
      key: "inStock",
      label: "Chỉ còn hàng",
      removeParams: ["inStock"],
    });
  }

  const defaultSort = context.presetSort || "newest";
  if (filters.sort && filters.sort !== defaultSort) {
    chips.push({
      key: "sort",
      label: `Sắp xếp: ${SORT_LABELS[filters.sort] ?? filters.sort}`,
      removeParams: ["sort"],
    });
  }

  return chips;
}

// eslint-disable-next-line react-refresh/only-export-components
export function applyCatalogDraftParams(
  current: URLSearchParams,
  draft: CatalogDraftFilters,
  options: { presetCategoryId?: string; presetSort?: string } = {}
): URLSearchParams {
  const next = new URLSearchParams(current);
  const defaultSort = options.presetSort || "newest";
  const resolvedSort = draft.sort || defaultSort;
  const entries: [string, string | null][] = [
    ["brandId", draft.brandId || null],
    ["categoryId", options.presetCategoryId ? null : draft.categoryId || null],
    ["gender", draft.gender || null],
    ["minPrice", draft.minPrice.trim() || null],
    ["maxPrice", draft.maxPrice.trim() || null],
    ["size", draft.size.trim() || null],
    ["color", draft.color.trim() || null],
    ["inStock", draft.inStock ? "true" : null],
    ["sort", resolvedSort !== defaultSort || options.presetSort ? resolvedSort : null],
  ];
  entries.forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });
  next.delete("page");
  return next;
}

// eslint-disable-next-line react-refresh/only-export-components
export function clearCatalogParams(
  current: URLSearchParams,
  options: { presetSort?: string; includeSearch?: boolean } = {}
): URLSearchParams {
  const next = new URLSearchParams();
  if (!options.includeSearch) {
    const search = current.get("search");
    if (search) next.set("search", search);
  }
  if (options.presetSort) next.set("sort", options.presetSort);
  return next;
}

// eslint-disable-next-line react-refresh/only-export-components
export function removeCatalogChipParams(
  current: URLSearchParams,
  chip: ActiveFilterChip,
  options: { presetSort?: string } = {}
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const param of chip.removeParams) {
    next.delete(param);
  }
  if (chip.key === "sort" && options.presetSort) {
    next.set("sort", options.presetSort);
  }
  next.delete("page");
  return next;
}

// eslint-disable-next-line react-refresh/only-export-components
export function createCatalogActions(deps: {
  searchParams: URLSearchParams;
  draft: CatalogDraftFilters;
  presetCategoryId?: string;
  presetSort?: string;
  setDraft: (next: CatalogDraftFilters) => void;
  setSearchParams: (next: URLSearchParams) => void;
  setPage: (page: number) => void;
  setMobileFiltersOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  scrollTo: (target: string, options?: { offset?: number }) => void;
}) {
  const scrollToResults = () => {
    deps.scrollTo(CATALOG_RESULTS_SELECTOR, { offset: CATALOG_SCROLL_OFFSET });
  };

  return {
    scrollToResults,
    toggleMobileFilters: () => {
      deps.setMobileFiltersOpen((open) => !open);
    },
    applyDraftFilters: () => {
      const next = applyCatalogDraftParams(deps.searchParams, deps.draft, {
        presetCategoryId: deps.presetCategoryId,
        presetSort: deps.presetSort,
      });
      deps.setPage(0);
      deps.setSearchParams(next);
      deps.setMobileFiltersOpen(false);
      scrollToResults();
    },
    clearFilters: () => {
      deps.setDraft({ ...emptyDraft, sort: deps.presetSort || "newest" });
      deps.setSearchParams(
        clearCatalogParams(deps.searchParams, {
          presetSort: deps.presetSort,
          includeSearch: false,
        })
      );
      deps.setPage(0);
      deps.setMobileFiltersOpen(false);
      scrollToResults();
    },
    clearAllFilters: () => {
      deps.setDraft({ ...emptyDraft, sort: deps.presetSort || "newest" });
      deps.setSearchParams(
        clearCatalogParams(deps.searchParams, {
          presetSort: deps.presetSort,
          includeSearch: true,
        })
      );
      deps.setPage(0);
      deps.setMobileFiltersOpen(false);
      scrollToResults();
    },
    removeFilterChip: (chip: ActiveFilterChip) => {
      const next = removeCatalogChipParams(deps.searchParams, chip, {
        presetSort: deps.presetSort,
      });
      deps.setPage(0);
      deps.setSearchParams(next);
      scrollToResults();
    },
    handlePageChange: (nextPage: number) => {
      deps.setPage(nextPage);
      scrollToResults();
    },
  };
}

export default function ProductListPage({
  presetCategoryId,
  presetSort,
  title,
  subtitle,
}: ProductListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { scrollTo } = useSmoothScroll();
  const shouldReduceMotion = useReducedMotion();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page") || 0));
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [draft, setDraft] = useState(() => draftFromParams(searchParams, presetSort));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchParamsKey = searchParams.toString();

  const actions = useMemo(
    () =>
      createCatalogActions({
        searchParams,
        draft,
        presetCategoryId,
        presetSort,
        setDraft,
        setSearchParams,
        setPage,
        setMobileFiltersOpen,
        scrollTo,
      }),
    [searchParams, draft, presetCategoryId, presetSort, setSearchParams, scrollTo]
  );

  const {
    scrollToResults,
    toggleMobileFilters,
    applyDraftFilters,
    clearFilters,
    clearAllFilters,
    removeFilterChip,
    handlePageChange,
  } = actions;

  const filters = useMemo<ProductFilterParams>(
    () => ({
      search: searchParams.get("search") || undefined,
      brandId: searchParams.get("brandId") || undefined,
      categoryId: presetCategoryId || searchParams.get("categoryId") || undefined,
      gender: searchParams.get("gender") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      variantSize: searchParams.get("size") || undefined,
      color: searchParams.get("color") || undefined,
      inStock: searchParams.get("inStock") === "true" ? true : undefined,
      sort: searchParams.get("sort") || presetSort || "newest",
      page,
      pageSize: PAGE_SIZE,
    }),
    [searchParams, presetCategoryId, presetSort, page]
  );

  useEffect(() => {
    Promise.all([brandApi.list(), categoryApi.list()]).then(([b, c]) => {
      setBrands(b);
      setCategories(c);
    });
  }, []);

  useEffect(() => {
    setDraft(draftFromParams(searchParams, presetSort));
    setPage(Number(searchParams.get("page") || 0));
  }, [searchParamsKey, searchParams, presetSort]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    productApi
      .list(filters)
      .then((result) => {
        setProducts(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const activeChips = useMemo(
    () =>
      buildActiveFilterChips(filters, {
        brands,
        categories,
        presetCategoryId,
        presetSort,
      }),
    [filters, brands, categories, presetCategoryId, presetSort]
  );

  const activeFilterCount = [
    filters.brandId,
    !presetCategoryId && filters.categoryId,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.variantSize,
    filters.color,
    filters.inStock,
    filters.sort && filters.sort !== (presetSort || "newest"),
  ].filter((value) => value !== undefined && value !== false && value !== "").length;

  const catalogViewKey = `${presetCategoryId || ""}:${presetSort || ""}:${searchParamsKey}:p${page}`;

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <Label>Thương hiệu</Label>
        <select
          className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white p-2.5 text-sm"
          value={draft.brandId}
          onChange={(e) => setDraft((d) => ({ ...d, brandId: e.target.value }))}
        >
          <option value="">Tất cả</option>
          {brands.map((b) => (
            <option key={b.brandId} value={b.brandId}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {!presetCategoryId && (
        <div>
          <Label>Danh mục</Label>
          <select
            className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white p-2.5 text-sm"
            value={draft.categoryId}
            onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
          >
            <option value="">Tất cả</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label>Giới tính</Label>
        <select
          className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white p-2.5 text-sm"
          value={draft.gender}
          onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}
        >
          <option value="">Tất cả</option>
          <option value="MEN">Nam</option>
          <option value="WOMEN">Nữ</option>
          <option value="UNISEX">Unisex</option>
          <option value="KIDS">Trẻ em</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Giá từ</Label>
          <Input
            className="mt-1.5 bg-white"
            value={draft.minPrice}
            onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
          />
        </div>
        <div>
          <Label>Giá đến</Label>
          <Input
            className="mt-1.5 bg-white"
            value={draft.maxPrice}
            onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Size</Label>
        <Input
          className="mt-1.5 bg-white"
          value={draft.size}
          onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
          placeholder="VD: 42"
        />
      </div>

      <div>
        <Label>Màu</Label>
        <Input
          className="mt-1.5 bg-white"
          value={draft.color}
          onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
          placeholder="VD: Đen"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.inStock}
          onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))}
        />
        Chỉ còn hàng
      </label>

      <div>
        <Label>Sắp xếp</Label>
        <select
          className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white p-2.5 text-sm"
          value={draft.sort}
          onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value }))}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="rating">Đánh giá cao</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button className="w-full bg-[#111111] text-white hover:bg-accent" onClick={applyDraftFilters}>
          Áp dụng
        </Button>
        <Button variant="outline" className="w-full bg-white" onClick={clearFilters}>
          Xóa lọc
        </Button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Cửa hàng giày cao cấp</p>
            <h1 className="mt-2 text-4xl font-bold md:text-5xl">{title || "Bộ sưu tập giày"}</h1>
            <p className="mt-3 max-w-xl text-sm text-[#6B7280] md:text-base">
              {subtitle || "Tìm giày theo style, size và màu."}
              {totalElements > 0 ? ` ${totalElements} sản phẩm đang bán.` : ""}
            </p>
          </div>
          <ProductSearchInput className="w-full md:w-80" onSearchSubmit={scrollToResults} />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside
            data-lenis-prevent
            className="w-full shrink-0 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:w-[260px] lg:overflow-y-auto overscroll-contain xl:w-[280px]"
          >
            <div className="flex items-center justify-between gap-2 lg:hidden">
              <button
                type="button"
                onClick={toggleMobileFilters}
                aria-expanded={mobileFiltersOpen}
                aria-controls="catalog-filter-panel"
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/25"
              >
                <span className="flex items-center gap-2 text-lg font-bold">
                  <SlidersHorizontal className="h-4 w-4 text-[#E53935]" aria-hidden="true" />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-[#111111] px-2 py-0.5 text-xs font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 text-[#6B7280] transition-transform duration-200",
                    mobileFiltersOpen && "rotate-180"
                  )}
                />
              </button>
            </div>

            <div className="mb-4 hidden items-center justify-between gap-2 lg:flex">
              <h2 className="text-lg font-bold">Bộ lọc</h2>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-[#111111] px-2 py-0.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </div>

            <div
              id="catalog-filter-panel"
              className={cn(
                "lg:block",
                mobileFiltersOpen
                  ? cn(
                      "mt-4 block",
                      !shouldReduceMotion && "animate-in fade-in slide-in-from-top-1 duration-200"
                    )
                  : "hidden"
              )}
            >
              {filterPanel}
            </div>
          </aside>

          <div id="catalog-results" className="min-w-0 flex-1">
            <AnimatePresence initial={false}>
              {activeChips.length > 0 ? (
                <motion.div
                  key="active-filter-chips"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: CRISP_EASE }}
                  aria-label="Bộ lọc đang áp dụng"
                  className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-xs"
                >
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    Đang lọc:
                  </span>
                  <AnimatePresence initial={false}>
                    {activeChips.map((chip) => (
                      <motion.button
                        key={chip.key}
                        type="button"
                        layout={!shouldReduceMotion}
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: CRISP_EASE }}
                        onClick={() => removeFilterChip(chip)}
                        aria-label={`Xóa bộ lọc ${chip.label}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F7F5] px-3 py-1 text-xs font-medium text-[#111111] transition-colors hover:border-[#E53935]/40 hover:bg-[#FEE2E2]/40 hover:text-[#E53935] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/25"
                      >
                        <span>{chip.label}</span>
                        <span aria-hidden="true" className="text-sm font-semibold leading-none">
                          ×
                        </span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="ml-auto cursor-pointer text-xs font-semibold text-[#E53935] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/30"
                  >
                    Xóa tất cả
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-square rounded-xl bg-[#F1F1EF]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                key={`empty-${catalogViewKey}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: CRISP_EASE }}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center"
              >
                <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
                <p className="mt-2 text-[#6B7280]">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                {activeChips.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 bg-white"
                    onClick={clearAllFilters}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                ) : null}
              </motion.div>
            ) : (
              <>
                <div
                  key={catalogViewKey}
                  className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-6"
                >
                  {products.map((product, index) => (
                    <motion.div
                      key={product.productId}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.28,
                        delay: shouldReduceMotion ? 0 : Math.min(index, 8) * 0.03,
                        ease: CRISP_EASE,
                      }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
                <ScrollReveal
                  direction="up"
                  distance={10}
                  duration={0.28}
                  viewport={{ once: true, amount: "some" }}
                >
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={handlePageChange}
                    className="mt-8"
                  />
                </ScrollReveal>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
