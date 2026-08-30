import { Link } from "react-router-dom";
import { ExternalLink, MapPin } from "lucide-react";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { ReturnFlowStepper } from "@/components/returns/ReturnFlowStepper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money } from "@/services/ecommerceServices";
import { formatShippingAddress, parseShippingAddress } from "@/utils/orderDisplay";
import { RETURN_ITEM_CONDITION_LABELS, REFUND_METHOD_LABELS } from "@/utils/returnFlow";
import { resolveReturnOrderItem } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

type ReturnRequestDetailPanelProps = {
  item: ReturnRequest;
  order: Order | null;
  loadingOrder?: boolean;
  orderDetailPath: string;
  embedded?: boolean;
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

export function ReturnRequestDetailPanel({
  item,
  order,
  loadingOrder,
  orderDetailPath,
  embedded = false,
}: ReturnRequestDetailPanelProps) {
  const orderItem = order ? resolveReturnOrderItem(item, { [order.orderId]: order }) : null;
  const shipping = parseShippingAddress(order?.shippingAddressSnapshot);

  return (
    <div className={embedded ? "space-y-4" : "space-y-4 border-t pt-4"}>
      <ReturnFlowStepper status={item.status} variant="staff" />

      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
        <p>Gửi: {formatDateTime(item.createdAt)}</p>
        {item.staffConfirmedAt ? <p>NV xác nhận: {formatDateTime(item.staffConfirmedAt)}</p> : null}
        {item.approvedAt ? <p>Duyệt: {formatDateTime(item.approvedAt)}</p> : null}
        {item.receivedAt ? <p>Nhận hàng: {formatDateTime(item.receivedAt)}</p> : null}
        {item.refundedAt ? <p>Hoàn tiền: {formatDateTime(item.refundedAt)}</p> : null}
        {item.rejectedAt ? <p>Từ chối: {formatDateTime(item.rejectedAt)}</p> : null}
      </div>

      {loadingOrder ? (
        <p className="text-sm text-muted-foreground">Đang tải thông tin đơn hàng...</p>
      ) : null}

      {orderItem ? (
        <section className="rounded-lg border bg-background p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sản phẩm trả
          </h3>
          <OrderItemRow item={orderItem} linkToProduct={false} />
        </section>
      ) : !loadingOrder ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm trong đơn hàng.</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2 rounded-lg border p-4">
          <h3 className="font-semibold">Đơn hàng</h3>
          {order ? (
            <>
              <p className="text-sm">
                Mã đơn:{" "}
                <Link
                  to={`${orderDetailPath}/orders/${order.orderId}`}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {order.orderCode}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </p>
              <p className="text-sm">
                Trạng thái: <StatusBadge kind="order" status={order.status} />
              </p>
              <p className="text-sm">
                Thanh toán: <StatusBadge kind="payment" status={order.paymentStatus} />
              </p>
              <p className="text-xs text-muted-foreground">Tạo lúc: {formatDateTime(order.createdAt)}</p>
              {order.deliveredAt ? (
                <p className="text-xs text-muted-foreground">Giao lúc: {formatDateTime(order.deliveredAt)}</p>
              ) : null}
              {order.trackingCode ? (
                <p className="text-sm">
                  Mã vận đơn: <span className="font-mono">{order.trackingCode}</span>
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Mã đơn: {item.orderId}</p>
          )}
        </section>

        <section className="space-y-2 rounded-lg border p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            Giao hàng
          </h3>
          {shipping ? (
            <div className="space-y-1 text-sm">
              <p>
                <strong>{shipping.recipientName}</strong> · {shipping.phone}
              </p>
              <p className="text-muted-foreground">
                {[shipping.line1, shipping.line2, shipping.ward, shipping.district, shipping.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {formatShippingAddress(order?.shippingAddressSnapshot)}
            </p>
          )}
        </section>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Chi tiết yêu cầu trả</h3>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Lý do:</span> {item.reason}
          </p>
          <p>
            <span className="text-muted-foreground">Gửi lúc:</span> {formatDateTime(item.createdAt)}
          </p>
        </div>
        {item.customerNote ? (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="mb-1 font-medium text-muted-foreground">Mô tả của khách</p>
            <p className="whitespace-pre-wrap">{item.customerNote}</p>
          </div>
        ) : null}
        {item.imageUrls && item.imageUrls.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Ảnh minh chứng</p>
            <div className="flex flex-wrap gap-2">
              {item.imageUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border transition hover:opacity-90"
                >
                  <img src={url} alt="Ảnh minh chứng trả hàng" className="h-20 w-20 object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Khách không đính kèm ảnh.</p>
        )}
      </section>

      <section className="space-y-2 rounded-md bg-muted/50 p-4 text-sm">
        <h3 className="font-semibold">Hoàn tiền & xử lý nội bộ</h3>
        {item.refundBankName && item.refundAccountNumber && item.refundAccountHolder ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-950">
            <p className="font-medium">Tài khoản nhận hoàn của khách</p>
            <p className="mt-1">
              {item.refundBankName} · <span className="font-mono">{item.refundAccountNumber}</span>
            </p>
            <p>Chủ TK: {item.refundAccountHolder}</p>
          </div>
        ) : (
          <p className="text-amber-700">Chưa có thông tin tài khoản nhận hoàn (yêu cầu cũ).</p>
        )}
        {item.refundAmount != null ? (
          <p>
            <strong>Số tiền hoàn dự kiến:</strong> {money(item.refundAmount)}
          </p>
        ) : null}
        {item.itemCondition ? (
          <p>
            <strong>Tình trạng hàng:</strong> {RETURN_ITEM_CONDITION_LABELS[item.itemCondition] ?? item.itemCondition}
            {item.maxRefundAmount != null ? ` · Trần hoàn ${money(item.maxRefundAmount)}` : ""}
          </p>
        ) : null}
        {item.receiveNote ? (
          <p>
            <strong>Ghi chú kiểm tra:</strong> {item.receiveNote}
          </p>
        ) : null}
        {item.shipBackDeadlineAt ? (
          <p>
            <strong>Hạn gửi hàng:</strong> {formatDateTime(item.shipBackDeadlineAt)}
          </p>
        ) : null}
        {item.refundRequestedAt ? (
          <p>
            <strong>Yêu cầu hoàn:</strong> {formatDateTime(item.refundRequestedAt)}
          </p>
        ) : null}
        {item.status === "REFUND_PENDING" ? (
          <p className="text-amber-700">Đang chờ Manager chuyển tiền thực tế và xác nhận.</p>
        ) : null}
        {item.refundTransactionRef ? (
          <p>
            <strong>Mã GD hoàn:</strong> <span className="font-mono">{item.refundTransactionRef}</span>
          </p>
        ) : null}
        {item.refundMethod ? (
          <p>
            <strong>Phương thức:</strong> {REFUND_METHOD_LABELS[item.refundMethod] ?? item.refundMethod}
          </p>
        ) : null}
        {item.refundProofUrl ? (
          <div>
            <strong>Chứng từ hoàn tiền:</strong>
            <a
              href={item.refundProofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block overflow-hidden rounded-lg border w-fit"
            >
              <img
                src={item.refundProofUrl}
                alt="Chứng từ hoàn tiền"
                className="max-h-48 object-cover"
              />
            </a>
          </div>
        ) : null}
        {item.refundNote ? (
          <p>
            <strong>Ghi chú hoàn:</strong> {item.refundNote}
          </p>
        ) : null}
        {item.staffNote ? (
          <p>
            <strong>Staff:</strong> {item.staffNote}
          </p>
        ) : null}
        {item.managerNote ? (
          <p>
            <strong>Manager:</strong> {item.managerNote}
          </p>
        ) : null}
        {item.rejectedReason ? (
          <p className="text-red-600">
            <strong>Lý do từ chối:</strong> {item.rejectedReason}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Cập nhật: {formatDateTime(item.updatedAt)}
          {item.refundCompletedAt ? ` · Hoàn xong: ${formatDateTime(item.refundCompletedAt)}` : ""}
          {item.closedAt ? ` · Đóng: ${formatDateTime(item.closedAt)}` : ""}
        </p>
      </section>
    </div>
  );
}
