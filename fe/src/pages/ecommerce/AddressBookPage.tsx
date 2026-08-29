import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addressApi } from "@/services/ecommerceServices";
import type { Address } from "@/types/ecommerce.type";

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    line1: "",
    city: "",
  });

  const load = async () => {
    setAddresses(await addressApi.list());
  };

  useEffect(() => {
    load().catch(() => toast.error("Không thể tải địa chỉ"));
  }, []);

  const handleCreate = async () => {
    try {
      await addressApi.create({ ...form, isDefault: addresses.length === 0 });
      setForm({ recipientName: "", phone: "", line1: "", city: "" });
      toast.success("Đã thêm địa chỉ");
      load();
    } catch {
      toast.error("Không thể thêm địa chỉ");
    }
  };

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Sổ địa chỉ</h1>
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.addressId} className="rounded-lg border p-4">
            <p className="font-semibold">{addr.recipientName} · {addr.phone}</p>
            <p className="text-sm text-muted-foreground">{addr.line1}, {addr.city}</p>
            {addr.isDefault && <p className="text-xs text-primary mt-1">Mặc định</p>}
            {!addr.isDefault && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => addressApi.setDefault(addr.addressId).then(load)}>
                Đặt mặc định
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Input placeholder="Tên người nhận" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
        <Input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Địa chỉ" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        <Input placeholder="Thành phố" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Button onClick={handleCreate}>Thêm địa chỉ</Button>
      </div>
    </main>
  );
}
