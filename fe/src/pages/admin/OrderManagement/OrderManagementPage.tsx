import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { money, orderApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { getOrderStatusLabel } from "@/utils/displayLabels";
import { orderStatusFilterOptions } from "@/utils/adminFilterOptions";
import { formatOrderItemNames } from "@/utils/productDisplay";
import type { Order, OrderStatus } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
  DELIVERED: "COMPLETED",
};

export default function OrderManagementPage() {
  const { access } = useRoleAccess();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderApi.adminList(
        statusFilter === "ALL" ? undefined : (statusFilter as OrderStatus),
        page,
        PAGE_SIZE,
        debouncedSearch || undefined
      );
      setOrders(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const advance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await orderApi.updateStatus(order.orderId, next);
      toast.success("Cập nhật trạng thái thành công");
      load();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo mã đơn (order code)...",
        }}
        selects={[
          {
            id: "order-status",
            label: "Trạng thái",
            value: statusFilter,
            onChange: setStatusFilter,
            options: orderStatusFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Tìm thấy ${totalElements} đơn hàng`}
      />

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="rounded-lg border p-6 text-center text-muted-foreground">
              Không có đơn hàng phù hợp bộ lọc.
            </p>
          ) : (
            orders.map((order) => (
              <div key={order.orderId} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{order.orderCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatOrderItemNames(order.items)} · {money(order.grandTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge kind="order" status={order.status} />
                  {access.manageOrders && NEXT_STATUS[order.status] && (
                    <Button size="sm" onClick={() => advance(order)}>
                      → {getOrderStatusLabel(NEXT_STATUS[order.status]!)}
                    </Button>
                  )}
                </div>
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
