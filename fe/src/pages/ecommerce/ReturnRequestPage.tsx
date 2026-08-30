import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReturnFlowStepper } from "@/components/returns/ReturnFlowStepper";
import { mediaApi, orderApi, returnApi } from "@/services/ecommerceServices";
import { RETURN_POLICY_SUMMARY } from "@/utils/returnFlow";
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
  const [images, setImages] = useState<File[]>([]);

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
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await mediaApi.uploadImages(images, "returns");
      }
      await returnApi.create({ orderId, orderItemId, reason, customerNote: description, imageUrls });
      toast.success("Đã gửi yêu cầu trả hàng");
      navigate(`/orders/${orderId}`);
    } catch {
      toast.error("Không thể gửi yêu cầu");
    }
  };

  return (
    <main className="mx-auto max-w-[600px] px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Yêu cầu trả hàng</h1>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
        <p className="text-sm font-semibold">Quy trình xử lý</p>
        <ReturnFlowStepper status="PENDING" variant="customer" />
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#6B7280]">
          {RETURN_POLICY_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
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
      <div>
        <label className="text-sm font-medium">Ảnh minh chứng (tuỳ chọn)</label>
        <Input type="file" accept="image/*" multiple className="mt-1" onChange={(e) => setImages(Array.from(e.target.files || []))} />
      </div>
      <Button onClick={handleSubmit}>Gửi yêu cầu</Button>
    </main>
  );
}
