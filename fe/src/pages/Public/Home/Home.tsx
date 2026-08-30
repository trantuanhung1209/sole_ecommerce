import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Headphones,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/home/ProductCard";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeReviewsSection } from "@/components/home/HomeReviewsSection";
import { brandApi, categoryApi, productApi, reviewApi } from "@/services/ecommerceServices";
import type { Brand, Category, HomeReviewsSummary, ProductSummary } from "@/types/ecommerce.type";
import { resolveCategoryImageUrl } from "@/utils/categoryDisplay";

const promoImage =
  "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80";

const perks = [
  { icon: Truck, title: "Giao nhanh 2-4 ngày", desc: "Miễn phí ship đơn từ 2 triệu" },
  { icon: ShieldCheck, title: "Hàng chính hãng", desc: "Cam kết authentic 100%" },
  { icon: RefreshCcw, title: "Đổi trả 7 ngày", desc: "Hỗ trợ đổi size dễ dàng" },
  { icon: Headphones, title: "Hỗ trợ 24/7", desc: "Chat AI + CSKH tận tâm" },
];

export default function Home() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeReviews, setHomeReviews] = useState<HomeReviewsSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productApi.list({ page: 0, pageSize: 100 }), brandApi.list(), categoryApi.list()])
      .then(([productPage, brandList, categoryList]) => {
        setProducts(productPage.content);
        setBrands(brandList);
        setCategories(categoryList);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reviewApi
      .home(4)
      .then(setHomeReviews)
      .catch(() => setHomeReviews(null))
      .finally(() => setReviewsLoading(false));
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(() => products.slice(0, 4), [products]);
  const topCategories = useMemo(() => categories.slice(0, 6), [categories]);
  const stats = useMemo(() => {
    const ratingValue =
      homeReviews && homeReviews.totalReviews > 0
        ? homeReviews.averageRating.toFixed(1)
        : "—";
    return [
      { value: "12+", label: "Mẫu sneaker hot" },
      { value: "8", label: "Thương hiệu" },
      { value: "200+", label: "Biến thể size/màu" },
      { value: ratingValue, label: "Đánh giá trung bình" },
    ];
  }, [homeReviews]);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <HomeHero products={products} brands={brands} stats={stats} loading={loading} />

      {/* Perks bar */}
      <section className="border-y border-[#E5E7EB] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-4 py-6 md:grid-cols-4 md:px-5">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="rounded-lg bg-[#F1F1EF] p-2">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1240px] px-4 py-12 md:px-5">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Danh mục</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Mua theo phong cách</h2>
          </div>
          <Button asChild variant="outline" className="hidden border-transparent bg-transparent md:inline-flex">
            <Link to="/products">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-2xl bg-[#F1F1EF]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((category) => (
              <Link
                key={category.categoryId}
                to={`/categories/${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F1F1EF]"
              >
                <img
                  src={resolveCategoryImageUrl(category, products)}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-sm font-bold">{category.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/80">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 md:px-5">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Bán chạy</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Sản phẩm nổi bật</h2>
          </div>
          <Button asChild variant="outline" className="border-[#D1D5DB] bg-white">
            <Link to="/products">Xem catalog</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4] rounded-2xl bg-[#F1F1EF]" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-[#9CA3AF]" />
            <h3 className="mt-4 text-xl font-bold">Chưa có sản phẩm</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Khởi động backend để tự động seed dữ liệu demo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} badge="HOT" />
            ))}
          </div>
        )}
      </section>

      {/* Promo split */}
      <section className="mx-auto max-w-[1240px] px-4 pb-12 md:px-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-[#111111] p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Sale cuối tuần</p>
            <h3 className="mt-3 max-w-sm text-3xl font-black">Giảm đến 12% compare-at price</h3>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Áp dụng cho các mẫu lifestyle & running trong catalog seed.
            </p>
            <Button asChild className="mt-6 bg-white text-[#111111] hover:bg-white/90">
              <Link to="/products">Mua ngay</Link>
            </Button>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl">
            <img src={promoImage} alt="New collection" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 p-8 text-white">
              <p className="text-xs font-bold uppercase tracking-widest">New collection</p>
              <h3 className="mt-3 max-w-sm text-3xl font-black">Jordan & Dunk season</h3>
              <p className="mt-3 max-w-md text-sm text-white/80">
                High-top classics và low-top Panda — có sẵn nhiều size.
              </p>
              <Button asChild variant="outline" className="mt-6 border-white bg-transparent text-white hover:bg-white/10">
                <Link to="/products">Khám phá</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-[#E5E7EB] bg-white py-12">
        <div className="mx-auto max-w-[1240px] px-4 md:px-5">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-[#E53935]">
            Thương hiệu
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold">Shop by brand</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {(loading ? Array.from({ length: 8 }) : brands).map((brand, index) =>
              loading ? (
                <Skeleton key={index} className="h-12 w-28 rounded-full bg-[#F1F1EF]" />
              ) : (
                <Link
                  key={(brand as Brand).brandId}
                  to={`/products?brand=${(brand as Brand).slug}`}
                  className="rounded-full border border-[#E5E7EB] bg-[#F7F7F5] px-5 py-3 text-sm font-bold transition hover:border-[#111111] hover:bg-white"
                >
                  {(brand as Brand).name}
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-[1240px] px-4 py-12 md:px-5">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Mới về</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Hàng mới nhất</h2>
          </div>
        </div>
        {!loading && newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.productId} product={product} badge="NEW" />
            ))}
          </div>
        ) : null}
      </section>

      <HomeReviewsSection data={homeReviews} loading={reviewsLoading} />

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-4 pb-16 md:px-5">
        <div className="rounded-2xl bg-[#111111] px-6 py-10 text-center text-white md:px-12 md:py-14">
          <Sparkles className="mx-auto h-6 w-6 text-[#E53935]" />
          <h2 className="mt-4 text-3xl font-black md:text-4xl">Sẵn sàng tìm đôi sneaker tiếp theo?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">
            {products.length > 0
              ? `${products.length} sản phẩm, ${brands.length} thương hiệu — dữ liệu demo sẵn sàng để test UI.`
              : "Khởi động backend để load catalog demo tự động."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 bg-white px-8 text-[#111111] hover:bg-white/90">
              <Link to="/products">Xem toàn bộ sản phẩm</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 border-white/30 bg-transparent px-8 text-white hover:bg-white/10">
              <Link to="/ai-chat">Hỏi trợ lý AI</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
