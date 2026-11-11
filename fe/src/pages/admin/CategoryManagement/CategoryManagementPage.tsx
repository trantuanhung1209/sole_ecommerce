import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { categoryApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { ADMIN_PAGE_SIZE, clampPage, paginateSlice, scrollPortalToTop } from "../utils/pagination";
import type { Category } from "@/types/ecommerce.type";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface CategoryManagementPageProps {
  initialCategories?: Category[];
  initialPage?: number;
}

export default function CategoryManagementPage({
  initialCategories,
  initialPage = 0,
}: CategoryManagementPageProps = {}) {
  const { access } = useRoleAccess();
  const { scrollToTop } = useSmoothScroll();
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(initialPage);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await categoryApi.list());
    } catch {
      toast.error("Không thể tải categories");
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
      await categoryApi.create({ name: name.trim(), slug: slug.trim() });
      setName("");
      setSlug("");
      toast.success("Tạo category thành công");
      await load();
    } catch {
      toast.error("Không thể tạo category");
    }
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => {
        if (!debouncedSearch) return true;
        const keyword = debouncedSearch.toLowerCase();
        return (
          category.name.toLowerCase().includes(keyword) ||
          category.slug.toLowerCase().includes(keyword)
        );
      }),
    [categories, debouncedSearch]
  );

  const {
    content: paginatedCategories,
    page: safePage,
    totalPages,
    totalElements,
  } = useMemo(() => paginateSlice(filteredCategories, page, PAGE_SIZE), [filteredCategories, page]);

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
      <h1 className="text-2xl font-bold">Quản lý danh mục</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên hoặc slug...",
        }}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Hiển thị ${paginatedCategories.length}/${totalElements} danh mục`}
      />

      {access.brandsCategories && (
        <div className="flex max-w-xl gap-2">
          <Input placeholder="Tên danh mục" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleCreate}>Tạo</Button>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedCategories.length === 0 ? (
              <p className="rounded-lg border p-6 text-center text-muted-foreground">
                Không có danh mục phù hợp bộ lọc.
              </p>
            ) : (
              paginatedCategories.map((c) => (
                <div key={c.categoryId} className="rounded-lg border p-3">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.slug}</p>
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
