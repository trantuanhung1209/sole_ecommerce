import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { promotionApi, type Coupon } from "@/services/ecommerceServices";

export default function PromotionManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE" as Coupon["type"], value: "10" });

  const load = () => promotionApi.listCoupons().then(setCoupons).catch(() => toast.error("Không tải được coupon"));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      await promotionApi.createCoupon({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        active: true,
      });
      toast.success("Đã tạo mã giảm giá");
      setForm({ code: "", type: "PERCENTAGE", value: "10" });
      load();
    } catch {
      toast.error("Không thể tạo coupon");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mã giảm giá</h1>
      <div className="grid gap-2 max-w-md">
        <Input placeholder="Mã (VD: SOLE10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}>
          <option value="PERCENTAGE">Phần trăm</option>
          <option value="FIXED_AMOUNT">Số tiền cố định</option>
          <option value="FREE_SHIPPING">Miễn phí ship</option>
        </select>
        <Input type="number" placeholder="Giá trị" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <Button onClick={create}>Tạo coupon</Button>
      </div>
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.couponId} className="rounded border p-3 flex justify-between text-sm">
            <span className="font-semibold">{c.code}</span>
            <span>{c.type} · {c.value} · đã dùng {c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
