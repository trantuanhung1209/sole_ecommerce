import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money, orderApi, returnApi } from "@/services/ecommerceServices";
import { resolveOrderCode, resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

export default function MyReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});

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
          const detailPath = `/returns/${item.returnId}`;
          return (
            <article key={item.returnId} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link to={detailPath} className="min-w-0 flex-1 group">
                  <p className="font-semibold group-hover:text-[#E53935]">{resolveReturnProductName(item, ordersLookup)}</p>
                  <p className="text-sm text-[#6B7280]">
                    {resolveOrderCode(item.orderId, ordersLookup)} · {item.reason}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                    {item.refundAmount != null ? ` · Hoàn dự kiến: ${money(item.refundAmount)}` : ""}
                  </p>
                  {item.status === "REFUND_PENDING" ? (
                    <p className="mt-1 text-xs font-medium text-amber-600">Cửa hàng đang xử lý hoàn tiền</p>
                  ) : null}
                  {item.status === "APPROVED" && item.shipBackDeadlineAt ? (
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      Gửi hàng trước {new Date(item.shipBackDeadlineAt).toLocaleDateString("vi-VN")}
                    </p>
                  ) : null}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge kind="return" status={item.status} />
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={detailPath}>
                      Chi tiết
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
