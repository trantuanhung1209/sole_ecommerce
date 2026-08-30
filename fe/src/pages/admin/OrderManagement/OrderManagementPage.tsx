import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { getPaymentStatusLabel, orderItemCount, orderItemImage } from "@/utils/orderDisplay";
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
  const location = useLocation();
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin";
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
      let trackingCode: string | undefined;
      if (next === "SHIPPED") {
        trackingCode = window.prompt("Nhập mã vận đơn (tracking code):") || undefined;
        if (!trackingCode?.trim()) {
          toast.error("Cần mã vận đơn khi giao cho shipper");
          return;
        }
      }
      await orderApi.updateStatus(order.orderId, next, trackingCode);
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
            orders.map((order) => {
              const previewItems = order.items.slice(0, 3);
              const extraCount = Math.max(0, order.items.length - previewItems.length);

              return (
                <div
                  key={order.orderId}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex shrink-0 items-center -space-x-2">
                      {previewItems.map((item) => (
                        <div
                          key={item.orderItemId}
                          className="h-12 w-12 overflow-hidden rounded-lg border-2 border-white bg-muted shadow-sm"
                        >
                          <img
                            src={orderItemImage(item)}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      ))}
                      {extraCount > 0 ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white bg-foreground text-xs font-bold text-background shadow-sm">
                          +{extraCount}
                        </div>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`${basePath}/orders/${order.orderId}`}
                          className="font-semibold hover:underline"
                        >
                          {order.orderCode}
                        </Link>
                        <StatusBadge kind="order" status={order.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("vi-VN")} · {orderItemCount(order)} sản phẩm
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm">
                        {order.items.map((item) => item.productNameSnapshot).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Thanh toán: {getPaymentStatusLabel(order.paymentStatus)}
                        {order.trackingCode ? ` · Vận đơn ${order.trackingCode}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-lg font-bold">{money(order.grandTotal)}</p>
                    {access.manageOrders && NEXT_STATUS[order.status] && (
                      <Button size="sm" onClick={() => advance(order)}>
                        → {getOrderStatusLabel(NEXT_STATUS[order.status]!)}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
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
