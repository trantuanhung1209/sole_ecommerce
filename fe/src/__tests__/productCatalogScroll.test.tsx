import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/services/ecommerceServices", () => ({
  money: (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount),
  brandApi: { list: vi.fn().mockResolvedValue([]) },
  categoryApi: { list: vi.fn().mockResolvedValue([]) },
  productApi: {
    list: vi.fn().mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 }),
  },
}));

vi.mock("@/components/home/ProductCard", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => <article>{product.name}</article>,
}));

import ProductListPage, {
  applyCatalogDraftParams,
  buildActiveFilterChips,
  CATALOG_PAGE_SIZE,
  CATALOG_RESULTS_SELECTOR,
  CATALOG_SCROLL_OFFSET,
  clearCatalogParams,
  createCatalogActions,
  removeCatalogChipParams,
  type CatalogDraftFilters,
} from "@/pages/ecommerce/ProductListPage";
import {
  ProductSearchInput,
  shouldApplyDebouncedSearch,
  submitProductSearch,
  syncDebouncedProductSearch,
} from "@/components/ecommerce/ProductSearchInput";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";
import type { Brand, Category } from "@/types/ecommerce.type";

const sampleBrands: Brand[] = [
  { brandId: "brand-nike", name: "Nike", slug: "nike" },
  { brandId: "brand-adidas", name: "Adidas", slug: "adidas" },
];

const sampleCategories: Category[] = [
  { categoryId: "cat-running", name: "Running", slug: "running" },
  { categoryId: "cat-lifestyle", name: "Lifestyle", slug: "lifestyle" },
];

const baseDraft: CatalogDraftFilters = {
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

function renderCatalog(initialEntry: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SmoothScrollProvider>
        <ProductListPage />
      </SmoothScrollProvider>
    </MemoryRouter>
  );
}

describe("ProductListPage scroll containment, anchor, mobile toggle & active chips", () => {
  it("renders sticky bounded filter aside with data-lenis-prevent, catalog-results anchor, and LCP heading", () => {
    const html = renderCatalog("/products");

    expect(html).toMatch(/<aside[^>]*data-lenis-prevent/);
    expect(html).toContain("lg:sticky lg:top-24");
    expect(html).toContain("lg:max-h-[calc(100vh-7.5rem)]");
    expect(html).toContain("lg:overflow-y-auto");
    expect(html).toContain("overscroll-contain");
    expect(html).toContain('id="catalog-results"');
    expect(html).toContain("<h1");
    expect(html).toContain("Bộ sưu tập giày");
    expect(html).not.toMatch(/<h1[^>]*opacity:\s*0/);
    expect(CATALOG_PAGE_SIZE).toBe(6);
    expect((html.match(/aspect-square rounded-xl bg-\[#F1F1EF\]/g) ?? []).length).toBe(6);
  });

  it("renders collapsible mobile filter toggle button with count badge and desktop-always-visible panel", () => {
    const html = renderCatalog("/products?brandId=brand-nike&gender=MEN&inStock=true");

    expect(html).toContain('aria-controls="catalog-filter-panel"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Bộ lọc");
    expect(html).toContain(">3</span>");
    expect(html).toContain('id="catalog-filter-panel"');
    expect(html).toContain("lg:block");
    expect(html).toContain("hidden");
  });

  it("renders active filter chips bar from URL params with 1-click remove and Xóa tất cả", () => {
    const html = renderCatalog(
      "/products?search=air+max&brandId=brand-nike&categoryId=cat-running&gender=MEN&minPrice=500000&maxPrice=2500000&size=42&color=Đen&inStock=true&sort=price_asc"
    );

    expect(html).toContain('aria-label="Bộ lọc đang áp dụng"');
    expect(html).toContain("Từ khóa: &quot;air max&quot;");
    expect(html).toContain("Thương hiệu: brand-nike");
    expect(html).toContain("Danh mục: cat-running");
    expect(html).toContain("Giới tính: Nam");
    expect(html).toContain("Size: 42");
    expect(html).toContain("Màu: Đen");
    expect(html).toContain("Chỉ còn hàng");
    expect(html).toContain("Sắp xếp: Giá tăng dần");
    expect(html).toContain("×");
    expect(html).toContain("Xóa tất cả");
  });

  it("hides active filter chips bar when no filters or search are active", () => {
    const html = renderCatalog("/products");
    expect(html).not.toContain('aria-label="Bộ lọc đang áp dụng"');
    expect(html).not.toContain("Xóa tất cả");
  });
});

describe("Catalog filter chip helpers & URL param transitions", () => {
  it("builds human-readable chips for all filter types and resolves brand/category names", () => {
    const chips = buildActiveFilterChips(
      {
        search: "jordan",
        brandId: "brand-nike",
        categoryId: "cat-running",
        gender: "WOMEN",
        minPrice: 1000000,
        maxPrice: 3000000,
        variantSize: "39",
        color: "Trắng",
        inStock: true,
        sort: "rating",
      },
      {
        brands: sampleBrands,
        categories: sampleCategories,
      }
    );

    expect(chips.map((c) => c.key)).toEqual([
      "search",
      "brandId",
      "categoryId",
      "gender",
      "price",
      "size",
      "color",
      "inStock",
      "sort",
    ]);
    expect(chips.find((c) => c.key === "brandId")?.label).toBe("Thương hiệu: Nike");
    expect(chips.find((c) => c.key === "categoryId")?.label).toBe("Danh mục: Running");
    expect(chips.find((c) => c.key === "gender")?.label).toBe("Giới tính: Nữ");
    expect(chips.find((c) => c.key === "sort")?.label).toBe("Sắp xếp: Đánh giá cao");
  });

  it("omits preset category and default sort from active chips", () => {
    const chips = buildActiveFilterChips(
      {
        categoryId: "cat-running",
        sort: "newest",
      },
      {
        brands: sampleBrands,
        categories: sampleCategories,
        presetCategoryId: "cat-running",
        presetSort: "newest",
      }
    );

    expect(chips).toEqual([]);
  });

  it("applies draft filters, removes single chips, and clears filters cleanly", () => {
    const initial = new URLSearchParams("search=dunk&page=2");
    const applied = applyCatalogDraftParams(initial, {
      ...baseDraft,
      brandId: "brand-nike",
      minPrice: "500000",
      maxPrice: "2000000",
      inStock: true,
      sort: "price_desc",
    });

    expect(applied.get("search")).toBe("dunk");
    expect(applied.get("brandId")).toBe("brand-nike");
    expect(applied.get("minPrice")).toBe("500000");
    expect(applied.get("maxPrice")).toBe("2000000");
    expect(applied.get("inStock")).toBe("true");
    expect(applied.get("sort")).toBe("price_desc");
    expect(applied.get("page")).toBeNull();

    const afterPriceRemoval = removeCatalogChipParams(applied, {
      key: "price",
      label: "Giá",
      removeParams: ["minPrice", "maxPrice"],
    });
    expect(afterPriceRemoval.get("minPrice")).toBeNull();
    expect(afterPriceRemoval.get("maxPrice")).toBeNull();
    expect(afterPriceRemoval.get("brandId")).toBe("brand-nike");

    const clearedKeepSearch = clearCatalogParams(applied, { includeSearch: false });
    expect(clearedKeepSearch.get("search")).toBe("dunk");
    expect(clearedKeepSearch.get("brandId")).toBeNull();

    const clearedAll = clearCatalogParams(applied, { includeSearch: true });
    expect(clearedAll.toString()).toBe("");
  });
});

describe("Catalog scroll & mobile toggle actions", () => {
  it("toggles mobile filters and calls scrollTo(#catalog-results, { offset: -96 }) on pagination, apply, clear, and chip removal", () => {
    let mobileOpen = false;
    const scrollTo = vi.fn();
    const setPage = vi.fn();
    const setSearchParams = vi.fn();
    const setDraft = vi.fn();
    const setMobileFiltersOpen = vi.fn((updater: boolean | ((prev: boolean) => boolean)) => {
      mobileOpen = typeof updater === "function" ? updater(mobileOpen) : updater;
    });

    const actions = createCatalogActions({
      searchParams: new URLSearchParams("search=nike&brandId=brand-nike&page=1"),
      draft: { ...baseDraft, brandId: "brand-adidas", size: "42" },
      setDraft,
      setSearchParams,
      setPage,
      setMobileFiltersOpen,
      scrollTo,
    });

    actions.toggleMobileFilters();
    expect(mobileOpen).toBe(true);
    actions.toggleMobileFilters();
    expect(mobileOpen).toBe(false);

    actions.handlePageChange(2);
    expect(setPage).toHaveBeenLastCalledWith(2);
    expect(scrollTo).toHaveBeenLastCalledWith(CATALOG_RESULTS_SELECTOR, {
      offset: CATALOG_SCROLL_OFFSET,
    });

    mobileOpen = true;
    actions.applyDraftFilters();
    expect(setPage).toHaveBeenLastCalledWith(0);
    expect(mobileOpen).toBe(false);
    expect(setSearchParams).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith("#catalog-results", { offset: -96 });

    actions.removeFilterChip({
      key: "brandId",
      label: "Thương hiệu: brand-nike",
      removeParams: ["brandId"],
    });
    expect(setPage).toHaveBeenLastCalledWith(0);
    expect(scrollTo).toHaveBeenLastCalledWith("#catalog-results", { offset: -96 });

    actions.clearFilters();
    expect(setDraft).toHaveBeenCalled();
    expect(scrollTo).toHaveBeenLastCalledWith("#catalog-results", { offset: -96 });

    actions.clearAllFilters();
    expect(scrollTo).toHaveBeenLastCalledWith("#catalog-results", { offset: -96 });
    expect(scrollTo).toHaveBeenCalledTimes(5);
  });
});

describe("ProductSearchInput polish & submit behavior", () => {
  it("renders accessible type=search input and toggles clear button based on query", () => {
    const emptyHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/products"]}>
        <SmoothScrollProvider>
          <ProductSearchInput />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(emptyHtml).toContain('type="search"');
    expect(emptyHtml).toContain('aria-label="Tìm kiếm sản phẩm"');
    expect(emptyHtml).not.toContain('aria-label="Xóa bộ lọc tìm kiếm"');

    const filledHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/products?search=ultraboost"]}>
        <SmoothScrollProvider>
          <ProductSearchInput />
        </SmoothScrollProvider>
      </MemoryRouter>
    );

    expect(filledHtml).toContain('value="ultraboost"');
    expect(filledHtml).toContain('aria-label="Xóa bộ lọc tìm kiếm"');
  });

  it("applies search and calls onSearchSubmit or scrolls to #catalog-results on listing pages", () => {
    const applySearch = vi.fn();
    const onSearchSubmit = vi.fn();
    const scrollTo = vi.fn();

    submitProductSearch({
      query: "jordan 1",
      applySearch,
      onSearchSubmit,
      onListingPage: true,
      scrollTo,
    });

    expect(applySearch).toHaveBeenCalledWith("jordan 1");
    expect(onSearchSubmit).toHaveBeenCalledWith("jordan 1");
    expect(scrollTo).not.toHaveBeenCalled();

    submitProductSearch({
      query: "pegasus",
      applySearch,
      onListingPage: true,
      scrollTo,
    });

    expect(applySearch).toHaveBeenCalledWith("pegasus");
    expect(scrollTo).toHaveBeenCalledWith("#catalog-results", { offset: -96 });
  });

  it("does not wipe fast Enter submit or re-apply stale debounced query after external chip reset", () => {
    const applySearch = vi.fn();

    // 1. User types "Nike" and submits via Enter before 300ms debounce fires:
    // search becomes "Nike" while debouncedQuery is still "" === prevDebouncedQuery.
    const prevAfterFastSubmit = syncDebouncedProductSearch({
      prevDebouncedQuery: "",
      debouncedQuery: "",
      query: "Nike",
      search: "Nike",
      applySearch,
    });
    expect(prevAfterFastSubmit).toBe("");
    expect(applySearch).not.toHaveBeenCalled();

    // 300ms later debouncedQuery catches up to "Nike" (already matches search).
    const prevAfterDebounceCatchup = syncDebouncedProductSearch({
      prevDebouncedQuery: prevAfterFastSubmit,
      debouncedQuery: "Nike",
      query: "Nike",
      search: "Nike",
      applySearch,
    });
    expect(prevAfterDebounceCatchup).toBe("Nike");
    expect(applySearch).not.toHaveBeenCalled();

    // 2. User clears search externally via "Từ khóa" chip / "Xóa tất cả":
    // search and query become "" while debouncedQuery is still "Nike".
    const prevAfterExternalReset = syncDebouncedProductSearch({
      prevDebouncedQuery: prevAfterDebounceCatchup,
      debouncedQuery: "Nike",
      query: "",
      search: "",
      applySearch,
    });
    expect(prevAfterExternalReset).toBe("Nike");
    expect(applySearch).not.toHaveBeenCalled();

    // Even if a stale debounced value arrives while query already changed, it is ignored.
    expect(
      shouldApplyDebouncedSearch({
        debouncedQuery: "Nike",
        query: "",
        search: "",
      })
    ).toBe(false);

    // 3. Normal debounced typing still applies when debouncedQuery changes and differs from search.
    const prevAfterTyping = syncDebouncedProductSearch({
      prevDebouncedQuery: "",
      debouncedQuery: "Adidas",
      query: "Adidas",
      search: "",
      applySearch,
    });
    expect(prevAfterTyping).toBe("Adidas");
    expect(applySearch).toHaveBeenCalledTimes(1);
    expect(applySearch).toHaveBeenCalledWith("Adidas");
  });
});
