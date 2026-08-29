import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { productApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  productStatusFilterOptions,
  publicStatusFilterOptions,
} from "@/utils/adminFilterOptions";
import type { Product, ProductStatus, PublicStatus } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;
const PLACEHOLDER =
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=200&q=80";

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { access } = useRoleAccess();
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [publicStatusFilter, setPublicStatusFilter] = useState("ALL");
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productApi.adminList(
        debouncedSearch || undefined,
        page,
        PAGE_SIZE,
        statusFilter === "ALL" ? undefined : (statusFilter as ProductStatus),
        publicStatusFilter === "ALL" ? undefined : (publicStatusFilter as PublicStatus)
      );
      setProducts(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, publicStatusFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, publicStatusFilter]);

  const handleCreate = async () => {
    if (!name || !slug) return;
    try {
      const created = await productApi.create({ name, slug, categoryIds: [], imageUrls: [] });
      setName("");
      setSlug("");
      toast.success("Tạo sản phẩm thành công — bổ sung ảnh và biến thể");
      navigate(`${basePath}/products/${created.productId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePublish = async (productId: string) => {
    try {
      await productApi.publish(productId);
      toast.success("Đã xuất bản sản phẩm");
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPublicStatusFilter("ALL");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Staff tạo draft → Admin duyệt → Shop Manager/Admin publish
        </p>
      </div>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên, mô tả...",
        }}
        selects={[
          {
            id: "product-status",
            label: "Trạng thái duyệt",
            value: statusFilter,
            onChange: setStatusFilter,
            options: productStatusFilterOptions(),
          },
          {
            id: "product-public-status",
            label: "Trạng thái công khai",
            value: publicStatusFilter,
            onChange: setPublicStatusFilter,
            options: publicStatusFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Tìm thấy ${totalElements} sản phẩm`}
      />

      {access.createProduct && (
        <div className="flex max-w-xl gap-2">
          <Input placeholder="Tên sản phẩm" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Đường dẫn (slug)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleCreate}>Tạo bản nháp</Button>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="rounded-lg border p-6 text-center text-muted-foreground">
                Không có sản phẩm phù hợp bộ lọc.
              </p>
            ) : (
              products.map((p) => (
                <div key={p.productId} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={p.imageUrls?.[0] || PLACEHOLDER}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StatusBadge kind="product" status={p.status} />
                    <StatusBadge kind="public" status={p.publicStatus} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`${basePath}/products/${p.productId}`)}
                    >
                      Quản lý
                    </Button>
                    {p.status === "PENDING_APPROVAL" && access.approveProduct && (
                      <>
                        <Button size="sm" onClick={() => productApi.approve(p.productId).then(load)}>
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => productApi.reject(p.productId, "Không đạt yêu cầu").then(load)}
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                    {p.status === "APPROVED" && access.publishProduct && (
                      <Button size="sm" onClick={() => handlePublish(p.productId)}>
                        Xuất bản
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
