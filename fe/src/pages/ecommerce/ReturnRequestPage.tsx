import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReturnFlowStepper } from "@/components/returns/ReturnFlowStepper";
import { mediaApi, orderApi, returnApi } from "@/services/ecommerceServices";
import { RETURN_POLICY_SUMMARY } from "@/utils/returnFlow";
import type { Order, OrderItem } from "@/types/ecommerce.type";
import { validateImageFiles } from "@/utils/imageUpload";
import { getErrorMessage } from "@/utils/getErrorMessage";

const MAX_RETURN_IMAGES = 4;

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const validationError = validateImageFiles(selected, MAX_RETURN_IMAGES);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setImages(selected);
  };

  const handleSubmit = async () => {
    if (!orderId || !orderItemId || !reason.trim()) return;
    if (!refundBankName.trim() || !refundAccountNumber.trim() || !refundAccountHolder.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin tài khoản nhận hoàn tiền");
      return;
    }
    if (!/^\d{6,20}$/.test(refundAccountNumber.trim())) {
      toast.error("Số tài khoản phải gồm 6–20 chữ số");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await mediaApi.uploadImages(images, "returns");
      }
      await returnApi.create({
        orderId,
        orderItemId,
        reason: reason.trim(),
        customerNote: description.trim() || undefined,
        refundBankName: refundBankName.trim(),
        refundAccountNumber: refundAccountNumber.trim(),
        refundAccountHolder: refundAccountHolder.trim(),
        imageUrls,
      });
      toast.success("Đã gửi yêu cầu trả hàng");
      navigate(`/orders/${orderId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-[720px] px-4 py-8 space-y-6">
      <div className="space-y-2">
        {orderId ? (
          <Link
            to={`/orders/${orderId}`}
            className="inline-flex text-sm font-medium text-[#6B7280] hover:text-[#111111]"
          >
            ← Quay lại chi tiết đơn
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold">Yêu cầu trả hàng</h1>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-4">
        <p className="text-sm font-semibold">Quy trình xử lý</p>
        <ReturnFlowStepper status="PENDING" variant="customer" />
        <div className="border-t pt-4">
          <p className="mb-2 text-sm font-semibold">Chính sách trả hàng</p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#6B7280]">
            {RETURN_POLICY_SUMMARY.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {items.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="return-item">Sản phẩm cần trả</Label>
          <select
            id="return-item"
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

      <div className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div>
          <p className="text-sm font-semibold">Tài khoản nhận hoàn tiền</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Cửa hàng sẽ chuyển khoản vào tài khoản này sau khi nhận và kiểm tra hàng trả.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-bank">Ngân hàng</Label>
          <Input
            id="refund-bank"
            placeholder="VD: Vietcombank, Techcombank, MB Bank..."
            value={refundBankName}
            onChange={(e) => setRefundBankName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-account">Số tài khoản</Label>
          <Input
            id="refund-account"
            inputMode="numeric"
            placeholder="Chỉ nhập số, 6–20 chữ số"
            value={refundAccountNumber}
            onChange={(e) => setRefundAccountNumber(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-holder">Tên chủ tài khoản</Label>
          <Input
            id="refund-holder"
            placeholder="Viết hoa không dấu như trên thẻ/tài khoản"
            value={refundAccountHolder}
            onChange={(e) => setRefundAccountHolder(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-reason">Lý do trả hàng</Label>
        <Input
          id="return-reason"
          placeholder="VD: Sai size, hàng lỗi..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return-description">Mô tả chi tiết</Label>
        <Textarea
          id="return-description"
          placeholder="Mô tả tình trạng sản phẩm, lý do trả..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return-images">Ảnh minh chứng (tuỳ chọn)</Label>
        <Input
          id="return-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleImagesChange}
        />
        <p className="text-xs text-muted-foreground">
          Tối đa {MAX_RETURN_IMAGES} ảnh, mỗi ảnh ≤ 5MB (JPEG, PNG, WebP)
        </p>
        {imagePreviews.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {imagePreviews.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`Minh chứng ${index + 1}`}
                className="h-20 w-20 rounded-lg border object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !reason.trim() ||
            !orderItemId ||
            !refundBankName.trim() ||
            !refundAccountNumber.trim() ||
            !refundAccountHolder.trim()
          }
        >
          {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (orderId ? navigate(`/orders/${orderId}`) : navigate("/orders"))}
          disabled={submitting}
        >
          Hủy
        </Button>
      </div>
    </main>
  );
}
