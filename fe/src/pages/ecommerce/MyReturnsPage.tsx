import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReturnFlowStepper } from "@/components/returns/ReturnFlowStepper";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money, orderApi, returnApi } from "@/services/ecommerceServices";
import { getReturnStatusLabel } from "@/utils/displayLabels";
import { resolveOrderCode, resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

export default function MyReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([returnApi.mine(), orderApi.mine(0, 100)])
      .then(([returnList, orderPage]) => {
        setReturns(returnList);
        setOrdersById(Object.fromEntries(orderPage.content.map((o) => [o.orderId, o])));
      })
      .catch(console.error);
  }, []);

  const ordersLookup = useMemo(() => ordersById, [ordersById]);

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu trả hàng</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Theo dõi tiến trình xử lý. Hoàn tiền chỉ thực hiện sau khi cửa hàng nhận lại hàng.
          </p>
        </div>
        <Link to="/orders" className="text-sm underline">
          Đơn hàng của tôi
        </Link>
      </div>

      {returns.length === 0 ? (
        <p className="text-[#6B7280]">Bạn chưa có yêu cầu trả hàng nào.</p>
      ) : (
        returns.map((item) => {
          const expanded = expandedId === item.returnId;
          return (
            <article key={item.returnId} className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => setExpandedId(expanded ? null : item.returnId)}
                >
                  <p className="font-semibold">{resolveReturnProductName(item, ordersLookup)}</p>
                  <p className="text-sm text-[#6B7280]">
                    {resolveOrderCode(item.orderId, ordersLookup)} · {item.reason}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                    {item.refundAmount != null ? ` · Hoàn dự kiến: ${money(item.refundAmount)}` : ""}
                  </p>
                </button>
                <StatusBadge kind="return" status={item.status} />
              </div>

              {expanded ? (
                <div className="space-y-4 border-t pt-4">
                  <ReturnFlowStepper status={item.status} variant="customer" />
                  {item.status === "REFUND_PENDING" ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Cửa hàng đang xử lý hoàn tiền. Bạn sẽ được thông báo khi tiền đã được chuyển.
                    </p>
                  ) : null}
                  {item.status === "REFUNDED" && item.refundTransactionRef ? (
                    <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      Đã hoàn {item.refundAmount != null ? money(item.refundAmount) : "tiền"}. Mã GD:{" "}
                      {item.refundTransactionRef}
                    </p>
                  ) : null}
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
                    <div className="flex flex-wrap gap-2">
                      {item.imageUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-16 w-16 rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <p className="text-xs text-[#6B7280]">
                    Trạng thái: <strong>{getReturnStatusLabel(item.status)}</strong>
                  </p>
                  <Link to={`/orders/${item.orderId}`} className="text-sm font-medium text-[#E53935] hover:underline">
                    Xem đơn hàng gốc
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })
      )}
    </main>
  );
}
