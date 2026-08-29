import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orderApi, returnApi } from "@/services/ecommerceServices";
import type { Order, OrderItem } from "@/types/ecommerce.type";

function formatOrderItemOption(item: OrderItem): string {
  return `${item.productNameSnapshot} · ${item.sizeSnapshot} · ${item.colorSnapshot} x${item.quantity}`;
}

export default function ReturnRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [orderItemId, setOrderItemId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!orderId) return;
    orderApi
      .detail(orderId)
      .then((order: Order) => {
        setItems(order.items);
        if (order.items[0]) setOrderItemId(order.items[0].orderItemId);
      })
      .catch(() => toast.error("Không thể tải đơn hàng"));
  }, [orderId]);

  const handleSubmit = async () => {
    if (!orderId || !orderItemId || !reason) return;
    try {
      await returnApi.create({ orderId, orderItemId, reason, description });
      toast.success("Đã gửi yêu cầu trả hàng");
      navigate(`/orders/${orderId}`);
    } catch {
      toast.error("Không thể gửi yêu cầu");
    }
  };

  return (
    <main className="mx-auto max-w-[600px] px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Yêu cầu trả hàng</h1>
      {items.length > 1 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Sản phẩm cần trả</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={orderItemId}
            onChange={(e) => setOrderItemId(e.target.value)}
          >
            {items.map((item) => (
              <option key={item.orderItemId} value={item.orderItemId}>
                {formatOrderItemOption(item)}
              </option>
            ))}
          </select>
        </div>
      ) : items.length === 1 ? (
        <div className="rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">Sản phẩm: </span>
          <span className="font-medium">{formatOrderItemOption(items[0])}</span>
        </div>
      ) : null}
      <Input placeholder="Lý do trả hàng" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Textarea placeholder="Mô tả chi tiết" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button onClick={handleSubmit}>Gửi yêu cầu</Button>
    </main>
  );
}
