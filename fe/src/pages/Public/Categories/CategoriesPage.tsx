import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryApi } from "@/services/ecommerceServices";
import type { Category } from "@/types/ecommerce.type";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .list()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Khám phá</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Danh mục sneaker</h1>
          <p className="mt-3 text-sm text-[#6B7280] md:text-base">
            Chọn theo phong cách — running, lifestyle, basketball, skate và nhiều hơn nữa.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3] rounded-2xl bg-[#E5E7EB]" />
              ))
            : categories.map((category) => (
                <Link
                  key={category.categoryId}
                  to={`/categories/${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#F1F1EF]">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-black text-[#D1D5DB]">
                        {category.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold">{category.name}</h2>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#E53935] transition-transform group-hover:translate-x-1" />
                    </div>
                    {category.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-[#6B7280]">{category.description}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </main>
  );
}
