import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ReturnRequestCustomerDetail } from "@/components/returns/ReturnRequestCustomerDetail";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orderApi, returnApi } from "@/services/ecommerceServices";
import { resolveOrderCode, resolveReturnProductName } from "@/utils/productDisplay";
import type { Order, ReturnRequest } from "@/types/ecommerce.type";

export default function MyReturnDetailPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ReturnRequest | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!returnId) return;
    setLoading(true);
    try {
      const returnItem = await returnApi.detail(returnId);
      setItem(returnItem);
      const orderDetail = await orderApi.detail(returnItem.orderId);
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

  if (loading) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-8">
        <p className="text-[#6B7280]">Đang tải...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-[900px] space-y-4 px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/returns")}>
          ← Yêu cầu trả hàng
        </Button>
        <p className="text-[#6B7280]">Không tìm thấy yêu cầu trả hàng.</p>
      </main>
    );
  }

  const ordersLookup = order ? { [order.orderId]: order } : {};

  return (
    <main className="mx-auto max-w-[900px] space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/returns")}>
            ← Yêu cầu trả hàng
          </Button>
          <h1 className="text-3xl font-bold">{resolveReturnProductName(item, ordersLookup)}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {resolveOrderCode(item.orderId, ordersLookup)} · {item.reason}
          </p>
          <p className="text-xs text-[#9CA3AF]">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
        </div>
        <StatusBadge kind="return" status={item.status} />
      </div>

      <ReturnRequestCustomerDetail item={item} order={order} />
    </main>
  );
}
