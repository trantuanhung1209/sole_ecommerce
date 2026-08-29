import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { submitSePayCheckout } from "@/components/payment/SePayRedirectForm";
import { addressApi, cartApi, checkoutApi, money } from "@/services/ecommerceServices";
import type { Address } from "@/types/ecommerce.type";

export default function CheckoutPage() {
  const [addressId, setAddressId] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [preview, setPreview] = useState({ itemCount: 0, subtotal: 0, shippingFee: 0, grandTotal: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([addressApi.list(), checkoutApi.preview(), cartApi.validate()])
      .then(([addrList, previewData, validation]) => {
        setAddresses(addrList);
        setPreview(previewData);
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr) {
          setAddressId(defaultAddr.addressId);
        }
        if (!validation.valid) {
          toast.error("Giỏ hàng không hợp lệ. Vui lòng quay lại giỏ hàng.");
        }
      })
      .catch(console.error);
  }, []);

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
      const payment = await checkoutApi.checkout(addressId);
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
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Địa chỉ giao hàng</h1>
            <Button asChild variant="outline" size="sm">
              <Link to="/addresses">Quản lý địa chỉ</Link>
            </Button>
          </div>
          {addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D1D5DB] p-6 text-center">
              <p className="text-[#6B7280]">Bạn chưa có địa chỉ nào.</p>
              <Button asChild className="mt-4">
                <Link to="/addresses">Thêm địa chỉ</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.addressId}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    addressId === addr.addressId ? "border-[#111111] ring-2 ring-[#111111]/10" : "border-[#E5E7EB]"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.addressId}
                    checked={addressId === addr.addressId}
                    onChange={() => setAddressId(addr.addressId)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold">
                      {addr.recipientName} · {addr.phone}
                      {addr.isDefault ? <span className="ml-2 text-xs text-[#6B7280]">(Mặc định)</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {[addr.line1, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedAddress ? (
            <p className="text-sm text-[#6B7280]">
              Giao đến: {selectedAddress.recipientName}, {selectedAddress.phone},{" "}
              {[selectedAddress.line1, selectedAddress.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
        <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-bold">Xem lại & thanh toán</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Sản phẩm</span><span>{preview.itemCount}</span></div>
            <div className="flex justify-between"><span>Tạm tính</span><span>{money(preview.subtotal)}</span></div>
            <div className="flex justify-between"><span>Phí vận chuyển</span><span>{money(preview.shippingFee)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Tổng cộng</span><span>{money(preview.grandTotal)}</span></div>
          </div>
          <p className="mt-3 text-sm text-[#6B7280]">
            Tồn kho được giữ trong 15 phút sau khi đặt hàng.
          </p>
          <Button
            className="mt-6 h-12 w-full rounded-lg bg-[#111111] text-white"
            disabled={loading || !addressId || addresses.length === 0}
            onClick={submit}
          >
            {loading ? "Đang tạo đơn..." : "Đặt hàng"}
          </Button>
        </aside>
      </section>
    </main>
  );
}
