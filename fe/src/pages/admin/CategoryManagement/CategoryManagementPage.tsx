import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { categoryApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import type { Category } from "@/types/ecommerce.type";

export default function CategoryManagementPage() {
  const { access } = useRoleAccess();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    try {
      setCategories(await categoryApi.list());
    } catch {
      toast.error("Không thể tải categories");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!name || !slug) return;
    try {
      await categoryApi.create({ name, slug });
      setName("");
      setSlug("");
      toast.success("Tạo category thành công");
      load();
    } catch {
      toast.error("Không thể tạo category");
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (!debouncedSearch) return true;
    const keyword = debouncedSearch.toLowerCase();
    return (
      category.name.toLowerCase().includes(keyword) ||
      category.slug.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý danh mục</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tên hoặc slug...",
        }}
        onReset={() => setSearch("")}
        resultText={`Hiển thị ${filteredCategories.length}/${categories.length} danh mục`}
      />

      {access.brandsCategories && (
        <div className="flex max-w-xl gap-2">
          <Input placeholder="Tên danh mục" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleCreate}>Tạo</Button>
        </div>
      )}

      <div className="space-y-2">
        {filteredCategories.map((c) => (
          <div key={c.categoryId} className="rounded-lg border p-3">
            <p className="font-semibold">{c.name}</p>
            <p className="text-sm text-muted-foreground">{c.slug}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
