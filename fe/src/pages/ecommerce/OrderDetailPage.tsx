import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { catalogApi, money, orderApi, reviewApi } from "@/services/ecommerceServices";
import type { Order, OrderItem } from "@/types/ecommerce.type";

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
        imageUrls = await catalogApi.uploadImages(images);
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
    <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAF9] p-4 space-y-3">
      <p className="font-semibold text-sm">Đánh giá sản phẩm</p>
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
      <Button size="sm" disabled={submitting} onClick={submit}>Gửi đánh giá</Button>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  const reload = () => {
    if (orderId) orderApi.detail(orderId).then(setOrder);
  };

  useEffect(() => {
    reload();
  }, [orderId]);

  if (!order) return <div className="p-8">Đang tải...</div>;

  const canReturn = ["DELIVERED", "COMPLETED"].includes(order.status);

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đơn hàng {order.orderCode}</h1>
          <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          {order.trackingCode ? (
            <p className="mt-1 text-sm">Mã vận đơn: <strong>{order.trackingCode}</strong></p>
          ) : null}
        </div>
        <StatusBadge kind="order" status={order.status} />
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="border-b pb-4 last:border-0">
            <div className="flex justify-between text-sm">
              <span>{item.productNameSnapshot} · {item.sizeSnapshot} · {item.colorSnapshot} x{item.quantity}</span>
              <span>{money(item.lineTotal)}</span>
            </div>
            <OrderItemReviewForm order={order} item={item} onReviewed={reload} />
          </div>
        ))}
        <div className="flex justify-between font-bold border-t pt-3">
          <span>Tổng cộng</span>
          <span>{money(order.grandTotal)}</span>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {["PENDING_PAYMENT", "PAID", "CONFIRMED"].includes(order.status) && (
          <Button variant="outline" onClick={() => orderApi.cancel(order.orderId).then(reload).then(() => toast.success("Đã hủy đơn"))}>
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
          <Link to="/orders">Quay lại</Link>
        </Button>
      </div>
    </main>
  );
}
