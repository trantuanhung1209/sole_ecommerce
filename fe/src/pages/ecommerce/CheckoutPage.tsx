import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitSePayCheckout } from "@/components/payment/SePayRedirectForm";
import { addressApi, cartApi, checkoutApi, money, promotionApi } from "@/services/ecommerceServices";
import type { Address } from "@/types/ecommerce.type";

export default function CheckoutPage() {
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [preview, setPreview] = useState({
    itemCount: 0, subtotal: 0, discountTotal: 0, shippingFee: 0, taxTotal: 0, grandTotal: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadPreview = async (code?: string) => {
    const previewData = await checkoutApi.preview(code);
    setPreview(previewData);
    if (previewData.couponMessage) setCouponMessage(previewData.couponMessage);
  };

  useEffect(() => {
    Promise.all([addressApi.list(), checkoutApi.preview(), cartApi.validate()])
      .then(([addrList, previewData, validation]) => {
        setAddresses(addrList);
        setPreview(previewData);
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr) setAddressId(defaultAddr.addressId);
        if (!validation.valid) toast.error("Giỏ hàng không hợp lệ. Vui lòng quay lại giỏ hàng.");
      })
      .catch(console.error);
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await promotionApi.validate(couponCode.trim(), preview.subtotal);
      setCouponMessage(result.message);
      if (result.valid) await loadPreview(couponCode.trim());
      else toast.error(result.message);
    } catch {
      toast.error("Không thể áp dụng mã");
    }
  };

  const submit = async () => {
    if (!addressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    const validation = await cartApi.validate();
    if (!validation.valid) {
      toast.error("Giỏ hàng không hợp lệ. Vui lòng cập nhật giỏ hàng.");
      return;
    }
    setLoading(true);
    try {
      const payment = await checkoutApi.checkout(addressId, customerNote, couponCode || undefined);
      toast.success("Đơn hàng đã tạo. Đang chuyển sang thanh toán...");
      submitSePayCheckout(payment);
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.addressId === addressId);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4">
          <span className="text-xl font-black">SOLE.</span>
          <span className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Lock className="h-4 w-4" />
            Thanh toán an toàn
          </span>
        </div>
      </header>
      <section className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Địa chỉ giao hàng</h1>
            <Button asChild variant="outline" size="sm">
              <Link to="/addresses">Quản lý địa chỉ</Link>
            </Button>
          </div>
          {addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D1D5DB] p-6 text-center">
              <p className="text-[#6B7280]">Bạn chưa có địa chỉ nào.</p>
              <Button asChild className="mt-4"><Link to="/addresses">Thêm địa chỉ</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label key={addr.addressId} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${addressId === addr.addressId ? "border-[#111111] ring-2 ring-[#111111]/10" : "border-[#E5E7EB]"}`}>
                  <input type="radio" name="address" checked={addressId === addr.addressId} onChange={() => setAddressId(addr.addressId)} className="mt-1" />
                  <div>
                    <p className="font-semibold">{addr.recipientName} · {addr.phone}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{[addr.line1, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Ghi chú đơn hàng (tuỳ chọn)</label>
            <Textarea className="mt-2" placeholder="Ghi chú giao hàng..." value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-4">
          <h2 className="text-xl font-bold">Xem lại & thanh toán</h2>
          <div className="flex gap-2">
            <Input placeholder="Mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <Button variant="outline" onClick={applyCoupon}>Áp dụng</Button>
          </div>
          {couponMessage ? <p className="text-xs text-muted-foreground">{couponMessage}</p> : null}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Sản phẩm</span><span>{preview.itemCount}</span></div>
            <div className="flex justify-between"><span>Tạm tính</span><span>{money(preview.subtotal)}</span></div>
            {preview.discountTotal > 0 && (
              <div className="flex justify-between text-green-700"><span>Giảm giá</span><span>-{money(preview.discountTotal)}</span></div>
            )}
            <div className="flex justify-between"><span>Phí vận chuyển</span><span>{money(preview.shippingFee)}</span></div>
            {preview.taxTotal > 0 && (
              <div className="flex justify-between"><span>VAT</span><span>{money(preview.taxTotal)}</span></div>
            )}
            <div className="flex justify-between font-bold border-t pt-2"><span>Tổng cộng</span><span>{money(preview.grandTotal)}</span></div>
          </div>
          <Button className="mt-2 h-12 w-full rounded-lg bg-[#111111] text-white" disabled={loading || !addressId || addresses.length === 0} onClick={submit}>
            {loading ? "Đang tạo đơn..." : "Đặt hàng"}
          </Button>
          {selectedAddress ? (
            <p className="text-xs text-[#6B7280]">Giao đến: {selectedAddress.recipientName}, {selectedAddress.phone}</p>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
