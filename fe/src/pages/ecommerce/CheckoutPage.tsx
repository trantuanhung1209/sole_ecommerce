import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addressApi, checkoutApi, money } from "@/services/ecommerceServices";
import type { Address } from "@/types/ecommerce.type";

export default function CheckoutPage() {
  const [shippingAddress, setShippingAddress] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [preview, setPreview] = useState({ itemCount: 0, subtotal: 0, shippingFee: 0, grandTotal: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([addressApi.list(), checkoutApi.preview()])
      .then(([addrList, previewData]) => {
        setAddresses(addrList);
        setPreview(previewData);
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr) {
          setShippingAddress(`${defaultAddr.recipientName}, ${defaultAddr.phone}, ${defaultAddr.line1}, ${defaultAddr.city}`);
        }
      })
      .catch(console.error);
  }, []);

  const submit = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please enter shipping address");
      return;
    }
    setLoading(true);
    try {
      const payment = await checkoutApi.checkout(shippingAddress);
      toast.success("Order created. Redirecting to payment...");
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4">
          <span className="text-xl font-black">SOLE.</span>
          <span className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Lock className="h-4 w-4" />
            Secure Checkout
          </span>
        </div>
      </header>
      <section className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Shipping Address</h1>
            <Button asChild variant="outline" size="sm">
              <Link to="/addresses">Quản lý địa chỉ</Link>
            </Button>
          </div>
          {addresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {addresses.map((addr) => (
                <Button
                  key={addr.addressId}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShippingAddress(`${addr.recipientName}, ${addr.phone}, ${addr.line1}, ${addr.city}`)
                  }
                >
                  {addr.recipientName}
                </Button>
              ))}
            </div>
          )}
          <Textarea
            className="min-h-36 rounded-lg"
            placeholder="Recipient, phone, street, ward, district, province"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
          />
        </div>
        <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-xl font-bold">Review & Pay</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Items</span><span>{preview.itemCount}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{money(preview.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{money(preview.shippingFee)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{money(preview.grandTotal)}</span></div>
          </div>
          <p className="mt-3 text-sm text-[#6B7280]">
            Stock reserved for 15 minutes after checkout.
          </p>
          <Button className="mt-6 h-12 w-full rounded-lg bg-[#111111] text-white" disabled={loading} onClick={submit}>
            {loading ? "Creating order..." : "Place order"}
          </Button>
        </aside>
      </section>
    </main>
  );
}
