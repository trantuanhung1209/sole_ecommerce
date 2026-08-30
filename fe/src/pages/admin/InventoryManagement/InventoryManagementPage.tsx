import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { inventoryApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { stockFilterOptions } from "@/utils/adminFilterOptions";
import { formatVariantLabel } from "@/utils/productDisplay";
import type { Inventory } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

export default function InventoryManagementPage() {
  const { access } = useRoleAccess();
  const [items, setItems] = useState<Inventory[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [importText, setImportText] = useState("");
  const [lowStockCount, setLowStockCount] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryApi.list(
        page,
        PAGE_SIZE,
        debouncedSearch || undefined,
        stockFilter === "ALL" ? undefined : stockFilter
      );
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải tồn kho");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, stockFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    inventoryApi.lowStock(5).then((rows) => setLowStockCount(rows.length)).catch(() => undefined);
  }, [items]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, stockFilter]);

  const handleAdjust = async (variantId: string) => {
    const change = Number(adjustments[variantId] || 0);
    if (!change) return;
    try {
      await inventoryApi.adjust(variantId, change);
      toast.success("Cập nhật tồn kho thành công");
      load();
    } catch {
      toast.error("Không thể cập nhật tồn kho");
    }
  };

  const handleImport = async () => {
    const lines = importText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("Nhập CSV: variantId,quantity (mỗi dòng một biến thể)");
      return;
    }
    const items: { variantId: string; quantity: number }[] = [];
    for (const line of lines) {
      const [variantId, qtyRaw] = line.split(",").map((s) => s.trim());
      const quantity = Number(qtyRaw);
      if (!variantId || Number.isNaN(quantity)) {
        toast.error("CSV không hợp lệ — dùng variantId,quantity");
        return;
      }
      items.push({ variantId, quantity });
    }
    try {
      await inventoryApi.importStock(items);
      toast.success(`Đã import ${items.length} dòng tồn kho`);
      setImportText("");
      load();
    } catch {
      toast.error("Import thất bại");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStockFilter("ALL");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý tồn kho</h1>
        <p className="text-sm text-muted-foreground">
          {access.adjustInventory
            ? "Shop Manager trở lên có thể điều chỉnh tồn kho"
            : "Chế độ xem — Staff chỉ theo dõi tồn kho"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {lowStockCount > 0 && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {lowStockCount} biến thể sắp hết hàng (≤5)
          </p>
        )}
      </div>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên SP, SKU, size, màu...",
        }}
        selects={[
          {
            id: "stock-filter",
            label: "Tình trạng tồn",
            value: stockFilter,
            onChange: setStockFilter,
            options: stockFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Tìm thấy ${totalElements} biến thể`}
      />

      {access.adjustInventory && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">Import CSV tồn kho</p>
          <p className="text-xs text-muted-foreground">Định dạng: variantId,quantity — mỗi dòng một biến thể</p>
          <textarea
            className="w-full min-h-[80px] rounded-md border bg-background p-2 text-sm font-mono"
            placeholder="variant-abc123,10&#10;variant-def456,-2"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <Button size="sm" onClick={handleImport}>
            Import
          </Button>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-lg border p-6 text-center text-muted-foreground">
              Không có tồn kho phù hợp bộ lọc.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{formatVariantLabel(item)}</p>
                  <p className="text-sm text-muted-foreground">
                    Tồn kho: {item.onHand} | Đã giữ: {item.reserved} | Còn bán: {item.available}
                  </p>
                </div>
                {access.adjustInventory && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="+/-"
                      value={adjustments[item.variantId] || ""}
                      onChange={(e) =>
                        setAdjustments({ ...adjustments, [item.variantId]: e.target.value })
                      }
                    />
                    <Button size="sm" onClick={() => handleAdjust(item.variantId)}>
                      Cập nhật
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
      />
    </div>
  );
}
