import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductListPage from "./ProductListPage";
import { SolePageLoader } from "@/components/shared/SolePageLoader";
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
    return <SolePageLoader label="Đang tải danh mục..." />;
  }

  return <ProductListPage presetCategoryId={category.categoryId} title={category.name} />;
}
