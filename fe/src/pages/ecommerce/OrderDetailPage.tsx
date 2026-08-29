import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money, orderApi } from "@/services/ecommerceServices";
import type { Order } from "@/types/ecommerce.type";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) {
      orderApi.detail(orderId).then(setOrder).catch(() => toast.error("Không thể tải đơn hàng"));
    }
  }, [orderId]);

  if (!order) return <div className="p-8">Đang tải...</div>;

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đơn hàng {order.orderCode}</h1>
          <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="flex justify-between text-sm">
            <span>{item.productNameSnapshot} · {item.sizeSnapshot} · {item.colorSnapshot} x{item.quantity}</span>
            <span>{money(item.lineTotal)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t pt-3">
          <span>Tổng cộng</span>
          <span>{money(order.grandTotal)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {["PENDING_PAYMENT", "PAID", "CONFIRMED"].includes(order.status) && (
          <Button variant="outline" onClick={() => orderApi.cancel(order.orderId).then(() => toast.success("Đã hủy đơn"))}>
            Hủy đơn
          </Button>
        )}
        {order.status === "DELIVERED" && (
          <Button asChild>
            <Link to={`/orders/${order.orderId}/return`}>Yêu cầu trả hàng</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/orders">Quay lại</Link>
        </Button>
      </div>
    </main>
  );
}
