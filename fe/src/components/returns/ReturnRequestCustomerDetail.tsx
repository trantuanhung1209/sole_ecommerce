import { Link } from "react-router-dom";
import { ReturnFlowStepper } from "@/components/returns/ReturnFlowStepper";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { money } from "@/services/ecommerceServices";
import { getReturnStatusLabel } from "@/utils/displayLabels";
import { RETURN_ITEM_CONDITION_LABELS } from "@/utils/returnFlow";
import { resolveReturnOrderItem } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

type ReturnRequestCustomerDetailProps = {
  item: ReturnRequest;
  order?: Order | null;
};

export function ReturnRequestCustomerDetail({ item, order }: ReturnRequestCustomerDetailProps) {
  const orderItem = order ? resolveReturnOrderItem(item, { [order.orderId]: order }) : null;

  return (
    <div className="space-y-4">
      <ReturnFlowStepper status={item.status} variant="customer" />

      {orderItem ? (
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Sản phẩm trả</h2>
          <OrderItemRow item={orderItem} linkToProduct />
        </section>
      ) : null}

      {item.refundBankName && item.refundAccountNumber && item.refundAccountHolder ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          TK nhận hoàn: <strong>{item.refundBankName}</strong> ·{" "}
          <span className="font-mono">{item.refundAccountNumber}</span> · {item.refundAccountHolder}
        </p>
      ) : null}

      {item.status === "APPROVED" && item.shipBackDeadlineAt ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Gửi hàng về trước <strong>{new Date(item.shipBackDeadlineAt).toLocaleString("vi-VN")}</strong>. Quá hạn có
          thể bị từ chối.
        </p>
      ) : null}

      {item.itemCondition ? (
        <p className="rounded-lg border p-3 text-sm">
          Tình trạng hàng khi shop kiểm tra:{" "}
          <strong>{RETURN_ITEM_CONDITION_LABELS[item.itemCondition] ?? item.itemCondition}</strong>
          {item.maxRefundAmount != null ? (
            <>
              {" "}
              · Trần hoàn: <strong>{money(item.maxRefundAmount)}</strong>
            </>
          ) : null}
        </p>
      ) : null}

      {item.status === "REFUND_PENDING" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Cửa hàng đang xử lý hoàn tiền. Bạn sẽ được thông báo khi tiền đã được chuyển.
        </p>
      ) : null}

      {item.status === "REFUNDED" && item.refundTransactionRef ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Đã hoàn {item.refundAmount != null ? money(item.refundAmount) : "tiền"}. Mã GD: {item.refundTransactionRef}
        </p>
      ) : null}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-2 text-sm">
        <p>
          <span className="text-[#6B7280]">Lý do:</span> {item.reason}
        </p>
        <p>
          <span className="text-[#6B7280]">Gửi lúc:</span> {new Date(item.createdAt).toLocaleString("vi-VN")}
        </p>
        {item.refundAmount != null ? (
          <p>
            <span className="text-[#6B7280]">Hoàn dự kiến:</span> {money(item.refundAmount)}
          </p>
        ) : null}
      </section>

      {item.customerNote ? (
        <p className="rounded-lg bg-[#F7F7F5] p-3 text-sm">
          <span className="font-medium">Mô tả của bạn:</span> {item.customerNote}
        </p>
      ) : null}

      {item.rejectedReason ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="font-medium">Lý do từ chối:</span> {item.rejectedReason}
        </p>
      ) : null}

      {item.imageUrls && item.imageUrls.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-[#6B7280]">Ảnh minh chứng</p>
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
      ) : null}

      <p className="text-xs text-[#6B7280]">
        Trạng thái: <strong>{getReturnStatusLabel(item.status)}</strong>
      </p>

      <Link to={`/orders/${item.orderId}`} className="inline-block text-sm font-medium text-[#E53935] hover:underline">
        Xem đơn hàng gốc
      </Link>
    </div>
  );
}
