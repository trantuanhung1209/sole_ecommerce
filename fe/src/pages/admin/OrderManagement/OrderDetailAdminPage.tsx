import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { OrderTotals } from "@/components/orders/OrderTotals";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orderApi, paymentApi } from "@/services/ecommerceServices";
import { getOrderStatusLabel } from "@/utils/displayLabels";
import {
  formatShippingAddress,
  getPaymentStatusLabel,
  orderItemCount,
  parseShippingAddress,
} from "@/utils/orderDisplay";
import type { Order, OrderStatus } from "@/types/ecommerce.type";
import { TrackingCodeDialog } from "@/components/orders/TrackingCodeDialog";
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
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [submittingShip, setSubmittingShip] = useState(false);

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

  const submitStatusUpdate = async (next: OrderStatus, trackingCode?: string) => {
    if (!order) return;
    try {
      await orderApi.updateStatus(order.orderId, next, trackingCode);
      toast.success("Cập nhật trạng thái thành công");
      reload();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const advance = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (next === "SHIPPED") {
      setShipDialogOpen(true);
      return;
    }
    await submitStatusUpdate(next);
  };

  const confirmShip = async (trackingCode: string) => {
    setSubmittingShip(true);
    try {
      await submitStatusUpdate("SHIPPED", trackingCode);
      setShipDialogOpen(false);
    } finally {
      setSubmittingShip(false);
    }
  };

  if (!order) return <div className="p-6">Đang tải...</div>;

  const basePath = window.location.pathname.startsWith("/staff") ? "/staff" : "/admin";
  const shipping = parseShippingAddress(order.shippingAddressSnapshot);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/orders`)}>
            ← Danh sách đơn
          </Button>
          <h1 className="mt-2 text-2xl font-bold">Đơn {order.orderCode}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("vi-VN")} · {orderItemCount(order)} sản phẩm
          </p>
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="font-semibold">Thanh toán</h2>
          <p className="text-sm">
            Trạng thái: <strong>{getPaymentStatusLabel(paymentStatus ?? order.paymentStatus)}</strong>
          </p>
          {order.paidAt ? (
            <p className="text-xs text-muted-foreground">
              Thanh toán lúc: {new Date(order.paidAt).toLocaleString("vi-VN")}
            </p>
          ) : null}
          {order.couponCode ? <p className="text-sm">Mã giảm giá: {order.couponCode}</p> : null}
        </div>
        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4" />
            Vận chuyển
          </h2>
          <p className="text-sm">
            {order.trackingCode ? `Mã vận đơn: ${order.trackingCode}` : "Chưa có tracking"}
          </p>
          {order.deliveredAt ? (
            <p className="text-xs text-muted-foreground">
              Giao lúc: {new Date(order.deliveredAt).toLocaleString("vi-VN")}
            </p>
          ) : null}
          {order.customerNote ? (
            <p className="text-sm text-muted-foreground">Ghi chú KH: {order.customerNote}</p>
          ) : null}
        </div>
      </div>

      {shipping || order.shippingAddressSnapshot ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            Địa chỉ giao hàng
          </h2>
          {shipping ? (
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">{shipping.recipientName}</p>
              <p className="text-muted-foreground">{shipping.phone}</p>
              <p className="mt-1">
                {[shipping.line1, shipping.line2, shipping.ward, shipping.district, shipping.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {formatShippingAddress(order.shippingAddressSnapshot)}
            </p>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Sản phẩm ({order.items.length})</h2>
        <div className="space-y-5 divide-y">
          {order.items.map((item) => (
            <div key={item.orderItemId} className="pb-5 last:pb-0">
              <OrderItemRow item={item} linkToProduct={false} />
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-4">
          <OrderTotals order={order} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Timeline</h2>
        <p className="text-sm">{getOrderStatusLabel(order.status)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {NEXT_STATUS[order.status] && access.manageOrders && (
          <Button onClick={advance}>Chuyển → {getOrderStatusLabel(NEXT_STATUS[order.status]!)}</Button>
        )}
        <Button variant="outline" asChild>
          <Link to={`${basePath}/returns`}>Xem trả hàng</Link>
        </Button>
      </div>

      <TrackingCodeDialog
        open={shipDialogOpen}
        onOpenChange={setShipDialogOpen}
        orderCode={order.orderCode}
        submitting={submittingShip}
        onSubmit={confirmShip}
      />
    </div>
  );
}
