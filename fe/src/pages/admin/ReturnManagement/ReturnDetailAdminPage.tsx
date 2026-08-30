import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  ConfirmRefundDialog,
  type ConfirmRefundPayload,
} from "@/components/returns/ConfirmRefundDialog";
import { MarkReceivedDialog, type MarkReceivedPayload } from "@/components/returns/MarkReceivedDialog";
import { ReturnActionDialog } from "@/components/returns/ReturnActionDialog";
import { ReturnRequestDetailPanel } from "@/components/returns/ReturnRequestDetailPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orderApi, returnApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getNextReturnActions, type ReturnActionType } from "@/utils/returnFlow";
import { resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

const ACTION_SUCCESS: Record<Exclude<ReturnActionType, "receive">, string> = {
  confirm: "Đã xác nhận yêu cầu",
  reject: "Đã từ chối yêu cầu",
  approve: "Đã duyệt trả hàng",
  requestRefund: "Đã tạo yêu cầu hoàn tiền — chờ chuyển khoản thực tế",
  confirmRefund: "Đã xác nhận hoàn tiền",
};

export default function ReturnDetailAdminPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { access } = useRoleAccess();
  const basePath = location.pathname.startsWith("/staff") ? "/staff" : "/admin";

  const [item, setItem] = useState<ReturnRequest | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<Exclude<ReturnActionType, "receive" | "confirmRefund"> | null>(
    null
  );
  const [confirmRefundOpen, setConfirmRefundOpen] = useState(false);
  const [markReceivedOpen, setMarkReceivedOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const reload = useCallback(async () => {
    if (!returnId) return;
    setLoading(true);
    try {
      const returnItem = await returnApi.adminDetail(returnId);
      setItem(returnItem);
      const orderDetail = await orderApi.adminDetail(returnItem.orderId);
      setOrder(orderDetail);
    } catch {
      toast.error("Không thể tải chi tiết yêu cầu trả hàng");
      setItem(null);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openAction = (action: ReturnActionType) => {
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
    if (!returnId) return;
    setSubmittingAction(true);
    try {
      switch (action) {
        case "confirm":
          await returnApi.staffConfirm(returnId, note || undefined);
          break;
        case "reject":
          await returnApi.reject(returnId, note);
          break;
        case "approve":
          await returnApi.approve(returnId, note || undefined);
          break;
        case "requestRefund":
          await returnApi.requestRefund(returnId, note || undefined);
          break;
        default:
          break;
      }
      toast.success(ACTION_SUCCESS[action]);
      setDialogOpen(false);
      void reload();
    } catch {
      toast.error("Không thể cập nhật. Kiểm tra quy trình và thử lại.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const runMarkReceived = async (payload: MarkReceivedPayload) => {
    if (!returnId) return;
    setSubmittingAction(true);
    try {
      await returnApi.markReceived(returnId, payload);
      toast.success("Đã nhận hàng trả — trần hoàn và tồn kho đã cập nhật theo tình trạng");
      setMarkReceivedOpen(false);
      void reload();
    } catch {
      toast.error("Không thể xác nhận nhận hàng. Kiểm tra hạn gửi và tình trạng hàng.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const runConfirmRefund = async (payload: ConfirmRefundPayload) => {
    if (!returnId) return;
    setSubmittingAction(true);
    try {
      await returnApi.confirmRefund(returnId, payload);
      toast.success(ACTION_SUCCESS.confirmRefund);
      setConfirmRefundOpen(false);
      void reload();
    } catch {
      toast.error("Không thể xác nhận hoàn tiền");
    } finally {
      setSubmittingAction(false);
    }
  };

  const canRunAction = (returnItem: ReturnRequest, action: ReturnActionType) => {
    if (!getNextReturnActions(returnItem.status).includes(action)) return false;
    if (action === "confirm" || action === "receive") return access.processReturnStaff;
    if (action === "reject") {
      return returnItem.status === "PENDING"
        ? access.processReturnStaff
        : returnItem.status === "STAFF_CONFIRMED" && access.approveReturn;
    }
    if (action === "approve" || action === "requestRefund" || action === "confirmRefund") {
      return access.approveReturn;
    }
    return false;
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  if (!item) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/returns`)}>
          ← Danh sách trả hàng
        </Button>
        <p className="text-muted-foreground">Không tìm thấy yêu cầu trả hàng.</p>
      </div>
    );
  }

  const ordersLookup = order ? { [order.orderId]: order } : {};
  const actions = getNextReturnActions(item.status).filter((action) => canRunAction(item, action));
  const productName = resolveReturnProductName(item, ordersLookup);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/returns`)}>
            ← Danh sách trả hàng
          </Button>
          <h1 className="mt-2 text-2xl font-bold">{productName}</h1>
          <p className="text-sm text-muted-foreground">
            {item.reason} · {new Date(item.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <StatusBadge kind="return" status={item.status} />
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-4">
          {actions.includes("confirm") && (
            <Button size="sm" onClick={() => openAction("confirm")}>
              Xác nhận
            </Button>
          )}
          {actions.includes("reject") && (
            <Button size="sm" variant="outline" onClick={() => openAction("reject")}>
              Từ chối
            </Button>
          )}
          {actions.includes("approve") && (
            <Button size="sm" onClick={() => openAction("approve")}>
              Duyệt trả hàng
            </Button>
          )}
          {actions.includes("receive") && (
            <Button size="sm" variant="outline" onClick={() => openAction("receive")}>
              Đã nhận hàng
            </Button>
          )}
          {actions.includes("requestRefund") && (
            <Button size="sm" onClick={() => openAction("requestRefund")}>
              Yêu cầu hoàn tiền
            </Button>
          )}
          {actions.includes("confirmRefund") && (
            <Button size="sm" onClick={() => openAction("confirmRefund")}>
              Xác nhận đã hoàn
            </Button>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border p-4">
        <ReturnRequestDetailPanel
          item={item}
          order={order}
          orderDetailPath={basePath}
          embedded
        />
      </div>

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
        defaultAmount={item.refundAmount}
        maxAmount={item.maxRefundAmount ?? item.refundAmount}
        refundBank={
          item.refundBankName && item.refundAccountNumber && item.refundAccountHolder
            ? {
                bankName: item.refundBankName,
                accountNumber: item.refundAccountNumber,
                accountHolder: item.refundAccountHolder,
              }
            : undefined
        }
        submitting={submittingAction}
        onOpenChange={setConfirmRefundOpen}
        onSubmit={runConfirmRefund}
      />
    </div>
  );
}
