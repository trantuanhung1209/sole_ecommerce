import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { brandApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { ADMIN_PAGE_SIZE, clampPage, paginateSlice, scrollPortalToTop } from "../utils/pagination";
import type { Brand } from "@/types/ecommerce.type";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface BrandManagementPageProps {
  initialBrands?: Brand[];
  initialPage?: number;
}

export default function BrandManagementPage({
  initialBrands,
  initialPage = 0,
}: BrandManagementPageProps = {}) {
  const { access } = useRoleAccess();
  const { scrollToTop } = useSmoothScroll();
  const [brands, setBrands] = useState<Brand[]>(initialBrands ?? []);
  const [loading, setLoading] = useState(!initialBrands);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(initialPage);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBrands(await brandApi.list());
    } catch {
      toast.error("Không thể tải brands");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      await brandApi.create({ name: name.trim(), slug: slug.trim() });
      setName("");
      setSlug("");
      toast.success("Tạo brand thành công");
      await load();
    } catch {
      toast.error("Không thể tạo brand");
    }
  };

  const filteredBrands = useMemo(
    () =>
      brands.filter((brand) => {
        if (!debouncedSearch) return true;
        const keyword = debouncedSearch.toLowerCase();
        return (
          brand.name.toLowerCase().includes(keyword) || brand.slug.toLowerCase().includes(keyword)
        );
      }),
    [brands, debouncedSearch]
  );

  const {
    content: paginatedBrands,
    page: safePage,
    totalPages,
    totalElements,
  } = useMemo(() => paginateSlice(filteredBrands, page, PAGE_SIZE), [filteredBrands, page]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const handlePageChange = (nextPage: number) => {
    setPage(clampPage(nextPage, totalPages));
    scrollPortalToTop(scrollToTop);
  };

  const resetFilters = () => {
    setSearch("");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên hoặc slug...",
        }}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Hiển thị ${paginatedBrands.length}/${totalElements} thương hiệu`}
      />

      {access.brandsCategories && (
        <div className="flex max-w-xl gap-2">
          <Input placeholder="Tên brand" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleCreate}>Tạo</Button>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedBrands.length === 0 ? (
              <p className="rounded-lg border p-6 text-center text-muted-foreground">
                Không có thương hiệu phù hợp bộ lọc.
              </p>
            ) : (
              paginatedBrands.map((b) => (
                <div key={b.brandId} className="rounded-lg border p-3">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-muted-foreground">{b.slug}</p>
                </div>
              ))
            )}
          </div>

          <TablePagination
            page={safePage}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
