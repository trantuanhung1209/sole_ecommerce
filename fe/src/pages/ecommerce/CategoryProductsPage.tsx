import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductListPage from "./ProductListPage";
import { categoryApi } from "@/services/ecommerceServices";
import type { Category } from "@/types/ecommerce.type";

export default function CategoryProductsPage() {
  const { slug = "" } = useParams();
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    categoryApi.list().then((items) => {
      setCategory(items.find((c) => c.slug === slug) || null);
    });
  }, [slug]);

  if (!category) {
    return <main className="min-h-screen bg-[#F7F7F5] p-8">Đang tải danh mục...</main>;
  }

  return <ProductListPage presetCategoryId={category.categoryId} title={category.name} />;
}
