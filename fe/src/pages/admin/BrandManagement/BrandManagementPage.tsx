import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { brandApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import type { Brand } from "@/types/ecommerce.type";

export default function BrandManagementPage() {
  const { access } = useRoleAccess();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    try {
      setBrands(await brandApi.list());
    } catch {
      toast.error("Không thể tải brands");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!name || !slug) return;
    try {
      await brandApi.create({ name, slug });
      setName("");
      setSlug("");
      toast.success("Tạo brand thành công");
      load();
    } catch {
      toast.error("Không thể tạo brand");
    }
  };

  const filteredBrands = brands.filter((brand) => {
    if (!debouncedSearch) return true;
    const keyword = debouncedSearch.toLowerCase();
    return (
      brand.name.toLowerCase().includes(keyword) || brand.slug.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên hoặc slug...",
        }}
        onReset={() => setSearch("")}
        resultText={`Hiển thị ${filteredBrands.length}/${brands.length} thương hiệu`}
      />

      {access.brandsCategories && (
        <div className="flex max-w-xl gap-2">
          <Input placeholder="Tên brand" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleCreate}>Tạo</Button>
        </div>
      )}

      <div className="space-y-2">
        {filteredBrands.map((b) => (
          <div key={b.brandId} className="rounded-lg border p-3">
            <p className="font-semibold">{b.name}</p>
            <p className="text-sm text-muted-foreground">{b.slug}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
