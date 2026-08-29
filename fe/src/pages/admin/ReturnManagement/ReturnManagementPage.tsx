import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { orderApi, returnApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { returnStatusFilterOptions } from "@/utils/adminFilterOptions";
import { resolveOrderCode, resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

export default function ReturnManagementPage() {
  const { access } = useRoleAccess();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ordersById = useMemo(
    () => Object.fromEntries(orders.map((order) => [order.orderId, order])),
    [orders]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [returnPage, orderPage] = await Promise.all([
        returnApi.adminList(page, PAGE_SIZE, statusFilter === "ALL" ? undefined : statusFilter),
        orderApi.adminList(undefined, 0, 200),
      ]);
      setReturns(returnPage.content);
      setTotalPages(returnPage.totalPages);
      setTotalElements(returnPage.totalElements);
      setOrders(orderPage.content);
    } catch {
      toast.error("Không thể tải yêu cầu trả hàng");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const runAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
      load();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đổi/trả hàng</h1>
        <p className="text-sm text-muted-foreground">
          Staff xác nhận → Manager duyệt → Nhận hàng → Hoàn tiền
        </p>
      </div>

      <AdminFilterBar
        selects={[
          {
            id: "return-status",
            label: "Trạng thái",
            value: statusFilter,
            onChange: setStatusFilter,
            options: returnStatusFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Tìm thấy ${totalElements} yêu cầu trả hàng`}
      />

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {returns.length === 0 ? (
            <p className="rounded-lg border p-6 text-center text-muted-foreground">
              Không có yêu cầu trả hàng phù hợp bộ lọc.
            </p>
          ) : (
            returns.map((item) => (
              <div key={item.returnId} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                <div>
                  <button type="button" className="text-left" onClick={() => setSelectedId(selectedId === item.returnId ? null : item.returnId)}>
                  <p className="font-semibold">{resolveReturnProductName(item, ordersById)}</p>
                  <p className="text-sm text-muted-foreground">
                    {resolveOrderCode(item.orderId, ordersById)} · {item.reason}
                  </p>
                  {item.manualRefundRequired && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Cần hoàn tiền thủ công qua SePay — xem RUNBOOK_REFUND.md</p>
                  )}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusBadge kind="return" status={item.status} />
                  {item.status === "PENDING" && access.processReturnStaff && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => runAction(() => returnApi.staffConfirm(item.returnId), "Đã xác nhận")}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAction(() => returnApi.reject(item.returnId), "Đã từ chối")}
                      >
                        Từ chối
                      </Button>
                    </>
                  )}
                  {item.status === "STAFF_CONFIRMED" && access.approveReturn && (
                    <Button
                      size="sm"
                      onClick={() => runAction(() => returnApi.approve(item.returnId), "Đã duyệt trả hàng")}
                    >
                      Duyệt trả hàng
                    </Button>
                  )}
                  {item.status === "APPROVED" && access.processReturnStaff && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        runAction(() => returnApi.markReceived(item.returnId), "Đã nhận hàng trả — tồn kho đã cập nhật")
                      }
                    >
                      Đã nhận hàng
                    </Button>
                  )}
                  {item.status === "RECEIVED" && access.approveReturn && (
                    <Button
                      size="sm"
                      onClick={() => runAction(() => returnApi.refund(item.returnId), "Đã hoàn tiền")}
                    >
                      Hoàn tiền
                    </Button>
                  )}
                </div>
                </div>
                {selectedId === item.returnId && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1 border-t pt-3">
                    {item.staffNote && <p><strong>Staff:</strong> {item.staffNote}</p>}
                    {item.managerNote && <p><strong>Manager:</strong> {item.managerNote}</p>}
                    {item.refundAmount != null && <p><strong>Hoàn:</strong> {item.refundAmount.toLocaleString("vi-VN")}đ</p>}
                    {item.rejectedReason && <p className="text-red-600"><strong>Lý do từ chối:</strong> {item.rejectedReason}</p>}
                    {item.manualRefundRequired && (
                      <p className="text-amber-700">manualRefundRequired=true — thực hiện hoàn SePay thủ công trước khi đóng ticket.</p>
                    )}
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
