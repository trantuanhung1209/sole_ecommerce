import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard } from "@/components/home/ProductCard";
import { TablePagination } from "@/components/shared/TablePagination";
import { brandApi, categoryApi, productApi, type ProductFilterParams } from "@/services/ecommerceServices";
import type { Brand, Category, ProductSummary } from "@/types/ecommerce.type";

const PAGE_SIZE = 12;

type ProductListPageProps = {
  presetCategoryId?: string;
  presetSort?: string;
  title?: string;
  subtitle?: string;
};

export default function ProductListPage({
  presetCategoryId,
  presetSort,
  title,
  subtitle,
}: ProductListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page") || 0));
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const filters = useMemo<ProductFilterParams>(() => ({
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
  }), [searchParams, presetCategoryId, presetSort, page]);

  const [draft, setDraft] = useState({
    brandId: "",
    categoryId: "",
    gender: "",
    minPrice: "",
    maxPrice: "",
    size: "",
    color: "",
    inStock: false,
    sort: "newest",
  });

  useEffect(() => {
    Promise.all([brandApi.list(), categoryApi.list()]).then(([b, c]) => {
      setBrands(b);
      setCategories(c);
    });
  }, []);

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

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    setPage(0);
    setSearchParams(next);
  };

  const applyDraftFilters = () => {
    const next = new URLSearchParams(searchParams);
    const entries: [string, string | null][] = [
      ["brandId", draft.brandId || null],
      ["categoryId", presetCategoryId ? null : draft.categoryId || null],
      ["gender", draft.gender || null],
      ["minPrice", draft.minPrice || null],
      ["maxPrice", draft.maxPrice || null],
      ["size", draft.size || null],
      ["color", draft.color || null],
      ["inStock", draft.inStock ? "true" : null],
      ["sort", draft.sort || "newest"],
    ];
    entries.forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete("page");
    setPage(0);
    setSearchParams(next);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraft({
      brandId: "",
      categoryId: "",
      gender: "",
      minPrice: "",
      maxPrice: "",
      size: "",
      color: "",
      inStock: false,
      sort: "newest",
    });
    const next = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) next.set("search", search);
    setSearchParams(next);
    setPage(0);
    setFilterOpen(false);
  };

  const activeFilterCount = [
    filters.brandId,
    !presetCategoryId && filters.categoryId,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.variantSize,
    filters.color,
    filters.inStock,
    filters.sort && filters.sort !== "newest",
  ].filter(Boolean).length;

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
          <div className="flex gap-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
              <Input
                className="h-11 rounded-lg bg-white pl-9"
                placeholder="Tìm giày..."
                value={searchParams.get("search") || ""}
                onChange={(event) => updateParam("search", event.target.value || null)}
              />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11 border-[#D1D5DB] bg-white text-[#111111]">
                  <SlidersHorizontal className="h-4 w-4" />
                  Lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <Label>Thương hiệu</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-[#D1D5DB] p-2"
                      value={draft.brandId}
                      onChange={(e) => setDraft((d) => ({ ...d, brandId: e.target.value }))}
                    >
                      <option value="">Tất cả</option>
                      {brands.map((b) => (
                        <option key={b.brandId} value={b.brandId}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {!presetCategoryId && (
                    <div>
                      <Label>Danh mục</Label>
                      <select
                        className="mt-1 w-full rounded-lg border border-[#D1D5DB] p-2"
                        value={draft.categoryId}
                        onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
                      >
                        <option value="">Tất cả</option>
                        {categories.map((c) => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label>Giới tính</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-[#D1D5DB] p-2"
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
                      <Input value={draft.minPrice} onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Giá đến</Label>
                      <Input value={draft.maxPrice} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Size</Label>
                    <Input value={draft.size} onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))} placeholder="VD: 42" />
                  </div>
                  <div>
                    <Label>Màu</Label>
                    <Input value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} placeholder="VD: Đen" />
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
                      className="mt-1 w-full rounded-lg border border-[#D1D5DB] p-2"
                      value={draft.sort}
                      onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value }))}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="price_asc">Giá tăng dần</option>
                      <option value="price_desc">Giá giảm dần</option>
                      <option value="rating">Đánh giá cao</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-[#111111] text-white" onClick={applyDraftFilters}>Áp dụng</Button>
                    <Button variant="outline" onClick={clearFilters}>Xóa lọc</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl bg-[#F1F1EF]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
            <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
            <p className="mt-2 text-[#6B7280]">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
              className="mt-8"
            />
          </>
        )}
      </section>
    </main>
  );
}
