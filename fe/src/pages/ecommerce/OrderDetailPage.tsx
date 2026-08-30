import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { MapPin, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { OrderTotals } from "@/components/orders/OrderTotals";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mediaApi, orderApi, returnApi, reviewApi } from "@/services/ecommerceServices";
import type { Order, OrderItem, ReturnRequest } from "@/types/ecommerce.type";
import {
  formatShippingAddress,
  orderItemCount,
  parseShippingAddress,
} from "@/utils/orderDisplay";
import { getOrderStatusLabel, getReturnStatusLabel } from "@/utils/displayLabels";
import { isReturnTerminal } from "@/utils/returnFlow";

function OrderItemReviewForm({ order, item, onReviewed }: { order: Order; item: OrderItem; onReviewed: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (item.reviewed) {
    return <p className="text-sm text-green-700">Đã đánh giá sản phẩm này</p>;
  }

  if (!["DELIVERED", "COMPLETED"].includes(order.status)) {
    return null;
  }

  const submit = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await mediaApi.uploadImages(images, "reviews");
      }
      await reviewApi.create({
        orderId: order.orderId,
        orderItemId: item.orderItemId,
        rating,
        title,
        content,
        imageUrls,
      });
      toast.success("Đã gửi đánh giá");
      onReviewed();
    } catch {
      toast.error("Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAF9] p-4">
      <p className="text-sm font-semibold">Đánh giá sản phẩm</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)}>
            <Star className={`h-5 w-5 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <Input placeholder="Tiêu đề (tuỳ chọn)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Chia sẻ trải nghiệm của bạn..." value={content} onChange={(e) => setContent(e.target.value)} />
      <Input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} />
      <Button size="sm" disabled={submitting} onClick={submit}>
        Gửi đánh giá
      </Button>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  const reload = () => {
    if (!orderId) return;
    orderApi.detail(orderId).then(setOrder);
    returnApi.mine().then((items) => setReturns(items.filter((item) => item.orderId === orderId)));
  };

  useEffect(() => {
    reload();
  }, [orderId]);

  if (!order) return <div className="p-8">Đang tải...</div>;

  const returnsByItemId = Object.fromEntries(returns.map((item) => [item.orderItemId, item]));
  const returnableStatuses = ["DELIVERED", "COMPLETED", "RETURN_REQUESTED"];
  const withinReturnWindow =
    order.deliveredAt &&
    Date.now() - new Date(order.deliveredAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
  const hasReturnableItem = order.items.some((item) => !returnsByItemId[item.orderItemId]);
  const canReturn = returnableStatuses.includes(order.status) && !!withinReturnWindow && hasReturnableItem;
  const shipping = parseShippingAddress(order.shippingAddressSnapshot);

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#111111]">
      <div className="mx-auto max-w-[900px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Chi tiết đơn hàng</p>
            <h1 className="mt-1 text-3xl font-bold">{order.orderCode}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {new Date(order.createdAt).toLocaleString("vi-VN")} · {orderItemCount(order)} sản phẩm
            </p>
          </div>
          <StatusBadge kind="order" status={order.status} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="font-bold">Thông tin thanh toán</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B7280]">Trạng thái đơn</dt>
                <dd className="font-semibold">{getOrderStatusLabel(order.status)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6B7280]">Thanh toán</dt>
                <dd>
                  <StatusBadge kind="payment" status={order.paymentStatus} />
                </dd>
              </div>
              {order.paidAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7280]">Thời gian thanh toán</dt>
                  <dd>{new Date(order.paidAt).toLocaleString("vi-VN")}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Truck className="h-4 w-4 text-[#E53935]" />
              Giao hàng
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.trackingCode ? (
                <p>
                  Mã vận đơn: <strong>{order.trackingCode}</strong>
                </p>
              ) : (
                <p className="text-[#6B7280]">Chưa có mã vận đơn</p>
              )}
              {order.deliveredAt ? (
                <p className="text-[#6B7280]">Giao lúc: {new Date(order.deliveredAt).toLocaleString("vi-VN")}</p>
              ) : null}
              {order.customerNote ? <p className="text-[#6B7280]">Ghi chú: {order.customerNote}</p> : null}
            </div>
          </div>
        </div>

        {shipping || order.shippingAddressSnapshot ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <MapPin className="h-4 w-4 text-[#E53935]" />
              Địa chỉ nhận hàng
            </h2>
            {shipping ? (
              <div className="mt-3 text-sm leading-relaxed">
                <p className="font-semibold">{shipping.recipientName}</p>
                <p className="text-[#6B7280]">{shipping.phone}</p>
                <p className="mt-1">
                  {[shipping.line1, shipping.line2, shipping.ward, shipping.district, shipping.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6B7280]">{formatShippingAddress(order.shippingAddressSnapshot)}</p>
            )}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <h2 className="font-bold">Sản phẩm ({order.items.length})</h2>
          <div className="mt-4 space-y-5 divide-y divide-[#F1F1EF]">
            {order.items.map((item) => {
              const itemReturn = returnsByItemId[item.orderItemId];
              return (
              <div key={item.orderItemId} className="pb-5 last:pb-0">
                <OrderItemRow item={item}>
                  {itemReturn ? (
                    <p className="mt-2 text-xs font-medium text-[#6B7280]">
                      Trả hàng: {getReturnStatusLabel(itemReturn.status)}
                      {!isReturnTerminal(itemReturn.status) ? " — xem tiến trình tại Yêu cầu trả hàng" : ""}
                    </p>
                  ) : null}
                  <OrderItemReviewForm order={order} item={item} onReviewed={reload} />
                </OrderItemRow>
              </div>
            );
            })}
          </div>
          <div className="mt-6 border-t border-[#E5E7EB] pt-5">
            <OrderTotals order={order} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {["PENDING_PAYMENT", "PAID", "CONFIRMED"].includes(order.status) && (
            <Button
              variant="outline"
              onClick={() =>
                orderApi
                  .cancel(order.orderId)
                  .then(reload)
                  .then(() => toast.success("Đã hủy đơn"))
              }
            >
              Hủy đơn
            </Button>
          )}
          {canReturn && (
            <Button asChild>
              <Link to={`/orders/${order.orderId}/return`}>Yêu cầu trả hàng</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/returns">Yêu cầu trả hàng của tôi</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/orders">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
