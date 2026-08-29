import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addressApi } from "@/services/ecommerceServices";
import type { Address } from "@/types/ecommerce.type";

const emptyForm = {
  recipientName: "",
  phone: "",
  line1: "",
  ward: "",
  district: "",
  city: "",
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setAddresses(await addressApi.list());
  };

  useEffect(() => {
    load().catch(() => toast.error("Không thể tải địa chỉ"));
  }, []);

  const handleCreate = async () => {
    try {
      await addressApi.create({ ...form, isDefault: addresses.length === 0 });
      setForm(emptyForm);
      toast.success("Đã thêm địa chỉ");
      load();
    } catch {
      toast.error("Không thể thêm địa chỉ");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await addressApi.update(editingId, form);
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Đã cập nhật địa chỉ");
      load();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.addressId);
    setForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      line1: addr.line1,
      ward: addr.ward ?? "",
      district: addr.district ?? "",
      city: addr.city,
    });
  };

  const remove = async (addressId: string) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      await addressApi.remove(addressId);
      toast.success("Đã xóa");
      load();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Sổ địa chỉ</h1>
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.addressId} className="rounded-lg border p-4">
            <p className="font-semibold">{addr.recipientName} · {addr.phone}</p>
            <p className="text-sm text-muted-foreground">
              {[addr.line1, addr.ward, addr.district, addr.city].filter(Boolean).join(", ")}
            </p>
            {addr.isDefault && <p className="text-xs text-primary mt-1">Mặc định</p>}
            <div className="mt-2 flex gap-2">
              {!addr.isDefault && (
                <Button size="sm" variant="outline" onClick={() => addressApi.setDefault(addr.addressId).then(load)}>
                  Đặt mặc định
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => startEdit(addr)}>
                <Pencil className="h-3 w-3 mr-1" /> Sửa
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(addr.addressId)}>
                <Trash2 className="h-3 w-3 mr-1" /> Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Input placeholder="Tên người nhận" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
        <Input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Địa chỉ" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        <Input placeholder="Phường/Xã" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        <Input placeholder="Quận/Huyện" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
        <Input placeholder="Thành phố" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Button onClick={editingId ? handleUpdate : handleCreate}>
          {editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}
        </Button>
        {editingId && (
          <Button variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy sửa</Button>
        )}
      </div>
      <Link to="/checkout" className="text-sm underline">Quay lại thanh toán</Link>
    </main>
  );
}
