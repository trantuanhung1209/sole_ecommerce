import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { money, orderApi, paymentApi } from "@/services/ecommerceServices";
import { getOrderStatusLabel } from "@/utils/displayLabels";
import type { Order, OrderStatus } from "@/types/ecommerce.type";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
  DELIVERED: "COMPLETED",
};

export default function OrderDetailAdminPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { access } = useRoleAccess();
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const reload = async () => {
    if (!orderId) return;
    try {
      const res = await orderApi.adminDetail(orderId);
      setOrder(res);
      const payment = await paymentApi.byOrder(orderId).catch(() => null);
      setPaymentStatus(payment?.status ?? res.paymentStatus ?? null);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
    }
  };

  useEffect(() => {
    void reload();
  }, [orderId]);

  const advance = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      let trackingCode: string | undefined;
      if (next === "SHIPPED") {
        trackingCode = window.prompt("Nhập mã vận đơn:") || undefined;
        if (!trackingCode?.trim()) {
          toast.error("Cần mã vận đơn");
          return;
        }
      }
      await orderApi.updateStatus(order.orderId, next, trackingCode);
      toast.success("Cập nhật trạng thái thành công");
      reload();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  if (!order) return <div className="p-6">Đang tải...</div>;

  const basePath = window.location.pathname.startsWith("/staff") ? "/staff" : "/admin";

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/orders`)}>← Danh sách đơn</Button>
          <h1 className="text-2xl font-bold mt-2">Đơn {order.orderCode}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold">Thanh toán</h2>
          <p className="text-sm">Trạng thái: <strong>{paymentStatus ?? "—"}</strong></p>
          <p className="text-sm">Tổng: <strong>{money(order.grandTotal ?? 0)}</strong></p>
          {order.couponCode ? <p className="text-sm">Mã giảm giá: {order.couponCode}</p> : null}
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold">Vận chuyển</h2>
          <p className="text-sm">{order.trackingCode ? `Mã vận đơn: ${order.trackingCode}` : "Chưa có tracking"}</p>
          {order.customerNote ? <p className="text-sm text-muted-foreground">Ghi chú KH: {order.customerNote}</p> : null}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-3">Sản phẩm</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.orderItemId} className="flex justify-between text-sm border-b pb-2">
              <span>{item.productNameSnapshot} · {item.sizeSnapshot} · x{item.quantity}</span>
              <span>{money(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Tạm tính</span><span>{money(order.subtotal ?? 0)}</span></div>
          {(order.discountTotal ?? 0) > 0 && (
            <div className="flex justify-between text-green-700"><span>Giảm giá</span><span>-{money(order.discountTotal!)}</span></div>
          )}
          <div className="flex justify-between"><span>Phí ship</span><span>{money(order.shippingFee ?? 0)}</span></div>
          {(order.taxTotal ?? 0) > 0 && (
            <div className="flex justify-between"><span>VAT</span><span>{money(order.taxTotal!)}</span></div>
          )}
          <div className="flex justify-between font-bold"><span>Tổng</span><span>{money(order.grandTotal ?? 0)}</span></div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Timeline</h2>
        <p className="text-sm">{getOrderStatusLabel(order.status)}</p>
        {order.paidAt && <p className="text-xs text-muted-foreground">Thanh toán: {new Date(order.paidAt).toLocaleString("vi-VN")}</p>}
        {order.deliveredAt && <p className="text-xs text-muted-foreground">Giao hàng: {new Date(order.deliveredAt).toLocaleString("vi-VN")}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {NEXT_STATUS[order.status] && access.manageOrders && (
          <Button onClick={advance}>Chuyển → {getOrderStatusLabel(NEXT_STATUS[order.status]!)}</Button>
        )}
        <Button variant="outline" asChild>
          <Link to={`${basePath}/returns`}>Xem trả hàng</Link>
        </Button>
      </div>
    </div>
  );
}
