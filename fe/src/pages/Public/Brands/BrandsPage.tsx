import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { brandApi } from "@/services/ecommerceServices";
import type { Brand } from "@/types/ecommerce.type";

function brandInitial(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    brandApi
      .list()
      .then(setBrands)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Thương hiệu</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Shop by brand</h1>
          <p className="mt-3 text-sm text-[#6B7280] md:text-base">
            Nike, Adidas, New Balance, Jordan và các thương hiệu sneaker hàng đầu — chính hãng 100%.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-2xl bg-[#E5E7EB]" />
              ))
            : brands.map((brand) => (
                <Link
                  key={brand.brandId}
                  to={`/products?brandId=${brand.brandId}`}
                  className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#111111] text-lg font-black text-white">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 object-contain" />
                    ) : (
                      brandInitial(brand.name)
                    )}
                  </div>
                  <h2 className="text-lg font-bold">{brand.name}</h2>
                  {brand.description ? (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-[#6B7280]">{brand.description}</p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#E53935]">
                    Xem sản phẩm
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
        </div>
      </section>
    </main>
  );
}
