import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import {
  ConfirmRefundDialog,
  type ConfirmRefundPayload,
} from "@/components/returns/ConfirmRefundDialog";
import { MarkReceivedDialog, type MarkReceivedPayload } from "@/components/returns/MarkReceivedDialog";
import { ReturnActionDialog } from "@/components/returns/ReturnActionDialog";
import { ReturnRequestDetailPanel } from "@/components/returns/ReturnRequestDetailPanel";
import { orderApi, reportApi, returnApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { returnStatusFilterOptions } from "@/utils/adminFilterOptions";
import { getNextReturnActions, type ReturnActionType } from "@/utils/returnFlow";
import { resolveOrderCode, resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

const ACTION_SUCCESS: Record<Exclude<ReturnActionType, "receive">, string> = {
  confirm: "Đã xác nhận yêu cầu",
  reject: "Đã từ chối yêu cầu",
  approve: "Đã duyệt trả hàng",
  requestRefund: "Đã tạo yêu cầu hoàn tiền — chờ chuyển khoản thực tế",
  confirmRefund: "Đã xác nhận hoàn tiền",
};

export default function ReturnManagementPage() {
  const { access } = useRoleAccess();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<Exclude<ReturnActionType, "receive" | "confirmRefund"> | null>(null);
  const [confirmRefundOpen, setConfirmRefundOpen] = useState(false);
  const [markReceivedOpen, setMarkReceivedOpen] = useState(false);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [returnAlerts, setReturnAlerts] = useState({
    overdueApproved: 0,
    staleRefundPending: 0,
    refundPending: 0,
  });

  const basePath = window.location.pathname.startsWith("/staff") ? "/staff" : "/admin";

  const ordersLookup = useMemo(
    () => Object.fromEntries(Object.entries(ordersById)),
    [ordersById]
  );

  const actionTarget = returns.find((item) => item.returnId === actionTargetId) ?? null;

  const ensureOrder = useCallback(async (orderId: string) => {
    if (ordersById[orderId]) return ordersById[orderId];
    setLoadingOrderId(orderId);
    try {
      const order = await orderApi.adminDetail(orderId);
      setOrdersById((prev) => ({ ...prev, [orderId]: order }));
      return order;
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
      return null;
    } finally {
      setLoadingOrderId(null);
    }
  }, [ordersById]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [returnPage, dashboard] = await Promise.all([
        returnApi.adminList(page, PAGE_SIZE, statusFilter === "ALL" ? undefined : statusFilter),
        reportApi.dashboard(),
      ]);
      setReturns(returnPage.content);
      setTotalPages(returnPage.totalPages);
      setTotalElements(returnPage.totalElements);
      setReturnAlerts({
        overdueApproved: dashboard.overdueApprovedReturns ?? 0,
        staleRefundPending: dashboard.staleRefundPendingReturns ?? 0,
        refundPending: dashboard.refundPendingReturns ?? 0,
      });
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
    setSelectedId(null);
  }, [statusFilter]);

  const toggleSelected = async (item: ReturnRequest) => {
    if (selectedId === item.returnId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(item.returnId);
    await ensureOrder(item.orderId);
  };

  const openAction = (returnId: string, action: ReturnActionType) => {
    setActionTargetId(returnId);
    if (action === "confirmRefund") {
      setConfirmRefundOpen(true);
      return;
    }
    if (action === "receive") {
      setMarkReceivedOpen(true);
      return;
    }
    setDialogAction(action);
    setDialogOpen(true);
  };

  const runReturnAction = async (action: Exclude<ReturnActionType, "receive">, note: string) => {
    if (!actionTargetId) return;
    setSubmittingAction(true);
    try {
      switch (action) {
        case "confirm":
          await returnApi.staffConfirm(actionTargetId, note || undefined);
          break;
        case "reject":
          await returnApi.reject(actionTargetId, note);
          break;
        case "approve":
          await returnApi.approve(actionTargetId, note || undefined);
          break;
        case "requestRefund":
          await returnApi.requestRefund(actionTargetId, note || undefined);
          break;
        default:
          break;
      }
      toast.success(ACTION_SUCCESS[action]);
      setDialogOpen(false);
      void load();
    } catch {
      toast.error("Không thể cập nhật. Kiểm tra quy trình và thử lại.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const runMarkReceived = async (payload: MarkReceivedPayload) => {
    if (!actionTargetId) return;
    setSubmittingAction(true);
    try {
      await returnApi.markReceived(actionTargetId, payload);
      toast.success("Đã nhận hàng trả — trần hoàn và tồn kho đã cập nhật theo tình trạng");
      setMarkReceivedOpen(false);
      void load();
    } catch {
      toast.error("Không thể xác nhận nhận hàng. Kiểm tra hạn gửi và tình trạng hàng.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const runConfirmRefund = async (payload: ConfirmRefundPayload) => {
    if (!actionTargetId) return;
    setSubmittingAction(true);
    try {
      await returnApi.confirmRefund(actionTargetId, payload);
      toast.success(ACTION_SUCCESS.confirmRefund);
      setConfirmRefundOpen(false);
      void load();
    } catch {
      toast.error("Không thể xác nhận hoàn tiền");
    } finally {
      setSubmittingAction(false);
    }
  };

  const canRunAction = (item: ReturnRequest, action: ReturnActionType) => {
    if (!getNextReturnActions(item.status).includes(action)) return false;
    if (action === "confirm" || action === "receive") return access.processReturnStaff;
    if (action === "reject") {
      return item.status === "PENDING"
        ? access.processReturnStaff
        : item.status === "STAFF_CONFIRMED" && access.approveReturn;
    }
    if (action === "approve" || action === "requestRefund" || action === "confirmRefund") {
      return access.approveReturn;
    }
    return false;
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setPage(0);
  };

  const selectedItem = returns.find((item) => item.returnId === selectedId) ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đổi/trả hàng</h1>
        <p className="text-sm text-muted-foreground">
          Nhận hàng → Yêu cầu hoàn tiền → Chuyển khoản thực tế → Xác nhận đã hoàn
        </p>
      </div>

      {(returnAlerts.overdueApproved > 0 || returnAlerts.staleRefundPending > 0) && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Cảnh báo vận hành</p>
          {returnAlerts.overdueApproved > 0 ? (
            <p>
              {returnAlerts.overdueApproved} yêu cầu đã duyệt nhưng quá hạn gửi hàng — scheduler sẽ tự từ chối hoặc
              cần xử lý thủ công.
            </p>
          ) : null}
          {returnAlerts.staleRefundPending > 0 ? (
            <p>
              {returnAlerts.staleRefundPending} yêu cầu REFUND_PENDING quá 3 ngày chưa xác nhận chuyển tiền
              {returnAlerts.refundPending > 0 ? ` (tổng ${returnAlerts.refundPending} đang chờ hoàn)` : ""}.
            </p>
          ) : null}
        </div>
      )}

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
            returns.map((item) => {
              const actions = getNextReturnActions(item.status).filter((action) => canRunAction(item, action));
              return (
                <div key={item.returnId} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <button type="button" className="text-left" onClick={() => void toggleSelected(item)}>
                        <p className="font-semibold">{resolveReturnProductName(item, ordersLookup)}</p>
                        <p className="text-sm text-muted-foreground">
                          {resolveOrderCode(item.orderId, ordersLookup)} · {item.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                          {item.imageUrls?.length ? ` · ${item.imageUrls.length} ảnh` : ""}
                        </p>
                        {item.status === "REFUND_PENDING" && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">
                            Chờ chuyển tiền thực tế — xác nhận sau khi đã chuyển khoản
                          </p>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <StatusBadge kind="return" status={item.status} />
                      {actions.includes("confirm") && (
                        <Button size="sm" onClick={() => openAction(item.returnId, "confirm")}>
                          Xác nhận
                        </Button>
                      )}
                      {actions.includes("reject") && (
                        <Button size="sm" variant="outline" onClick={() => openAction(item.returnId, "reject")}>
                          Từ chối
                        </Button>
                      )}
                      {actions.includes("approve") && (
                        <Button size="sm" onClick={() => openAction(item.returnId, "approve")}>
                          Duyệt trả hàng
                        </Button>
                      )}
                      {actions.includes("receive") && (
                        <Button size="sm" variant="outline" onClick={() => openAction(item.returnId, "receive")}>
                          Đã nhận hàng
                        </Button>
                      )}
                      {actions.includes("requestRefund") && (
                        <Button size="sm" onClick={() => openAction(item.returnId, "requestRefund")}>
                          Yêu cầu hoàn tiền
                        </Button>
                      )}
                      {actions.includes("confirmRefund") && (
                        <Button size="sm" onClick={() => openAction(item.returnId, "confirmRefund")}>
                          Xác nhận đã hoàn
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedId === item.returnId && selectedItem ? (
                    <ReturnRequestDetailPanel
                      item={selectedItem}
                      order={ordersById[item.orderId] ?? null}
                      loadingOrder={loadingOrderId === item.orderId}
                      orderDetailPath={basePath}
                    />
                  ) : null}
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

      <ReturnActionDialog
        open={dialogOpen}
        action={dialogAction}
        submitting={submittingAction}
        onOpenChange={setDialogOpen}
        onSubmit={runReturnAction}
      />

      <MarkReceivedDialog
        open={markReceivedOpen}
        submitting={submittingAction}
        onOpenChange={setMarkReceivedOpen}
        onSubmit={runMarkReceived}
      />

      <ConfirmRefundDialog
        open={confirmRefundOpen}
        defaultAmount={actionTarget?.refundAmount}
        maxAmount={actionTarget?.maxRefundAmount ?? actionTarget?.refundAmount}
        submitting={submittingAction}
        onOpenChange={setConfirmRefundOpen}
        onSubmit={runConfirmRefund}
      />
    </div>
  );
}
