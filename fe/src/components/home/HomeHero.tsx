import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/services/ecommerceServices";
import type { Brand, ProductSummary } from "@/types/ecommerce.type";
import { DEFAULT_CATEGORY_IMAGE } from "@/utils/categoryDisplay";

const HERO_SLUGS = [
  "air-jordan-1-retro-high",
  "nike-dunk-low",
  "adidas-samba-og",
  "adidas-ultraboost-22",
  "nike-air-force-1-07",
  "new-balance-550",
] as const;

const CAROUSEL_INTERVAL_MS = 4200;
const CAROUSEL_TRANSITION_MS = 1600;
const CAROUSEL_RADIUS_PX = 210;

const FALLBACK_HERO = DEFAULT_CATEGORY_IMAGE;

type HeroStat = { value: string; label: string };

type HomeHeroProps = {
  products: ProductSummary[];
  brands: Brand[];
  stats: HeroStat[];
  loading?: boolean;
};

function findProduct(products: ProductSummary[], slug: string) {
  return products.find((p) => p.slug === slug);
}

function productUrl(product: ProductSummary) {
  return `/products/${product.slug || product.productId}`;
}

type HeroShoeCarouselProps = {
  products: ProductSummary[];
  onActiveProductChange?: (product: ProductSummary | undefined) => void;
};

function HeroShoeCarousel({ products, onActiveProductChange }: HeroShoeCarouselProps) {
  const slides = useMemo(
    () => products.filter((p) => p.imageUrls?.[0]).slice(0, 6),
    [products]
  );
  const count = slides.length;
  const angleStep = count > 0 ? 360 / count : 0;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const active = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    onActiveProductChange?.(active);
  }, [active, onActiveProductChange]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, count]);

  if (count === 0) return null;

  return (
    <div
      className="relative mx-auto h-[360px] w-full max-w-[440px] sm:h-[400px] lg:h-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="absolute left-1/2 top-[42%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E53935]/20 blur-3xl sm:h-[300px] sm:w-[300px]" />

      <div
        className="relative h-full w-full [perspective:1200px]"
        aria-live="polite"
        aria-roledescription="carousel"
        aria-label="Sản phẩm nổi bật"
      >
        <div
          className="relative h-full w-full [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{
            transform: `rotateY(${-activeIndex * angleStep}deg)`,
            transition: `transform ${CAROUSEL_TRANSITION_MS}ms cubic-bezier(0.45, 0, 0.25, 1)`,
          }}
        >
          {slides.map((product, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={product.productId}
                to={productUrl(product)}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                className="absolute left-1/2 top-[38%] w-[56%] max-w-[240px] -translate-x-1/2 -translate-y-1/2 [backface-visibility:hidden] motion-reduce:transition-none sm:max-w-[260px]"
                style={{
                  transform: `rotateY(${index * angleStep}deg) translateZ(${CAROUSEL_RADIUS_PX}px) scale(${isActive ? 1 : 0.82})`,
                  opacity: isActive ? 1 : 0.28,
                  transition: `opacity ${CAROUSEL_TRANSITION_MS}ms ease, transform ${CAROUSEL_TRANSITION_MS}ms cubic-bezier(0.45, 0, 0.25, 1)`,
                  zIndex: isActive ? 20 : 10,
                }}
              >
                <div className="relative">
                  {isActive ? (
                    <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-b from-white/25 to-transparent blur-xl" />
                  ) : null}
                  <div
                    className={`relative overflow-hidden rounded-[1.5rem] border bg-gradient-to-b from-white/15 to-white/5 p-2.5 shadow-2xl backdrop-blur-md sm:p-3 ${
                      isActive ? "border-white/25" : "border-white/10"
                    }`}
                  >
                    <img
                      src={product.imageUrls?.[0] || FALLBACK_HERO}
                      alt={product.name}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      {count > 1 ? (
        <div className="absolute bottom-[88px] left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {slides.map((product, index) => (
            <button
              key={product.productId}
              type="button"
              aria-label={`Xem ${product.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === activeIndex ? "w-7 bg-[#E53935]" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}

      {/* Info card */}
      <div className="absolute bottom-0 left-1/2 z-30 w-[min(100%,320px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#111111]/85 p-4 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E53935]">
              <Zap className="h-3.5 w-3.5" />
              Spotlight
            </div>
            <p key={active.productId} className="mt-1 truncate text-sm font-bold animate-fade-in">
              {active.name}
            </p>
            {active.minPrice != null ? (
              <p className="mt-0.5 text-xs text-white/55">Từ {money(active.minPrice)}</p>
            ) : null}
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-[#E53935]/80" />
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ products, brands, stats, loading }: HomeHeroProps) {
  const carouselProducts = useMemo(() => {
    const picked = HERO_SLUGS.map((slug) => findProduct(products, slug)).filter(Boolean) as ProductSummary[];
    const pickedIds = new Set(picked.map((p) => p.productId));
    const rest = products.filter((p) => !pickedIds.has(p.productId) && p.imageUrls?.[0]);
    return [...picked, ...rest].slice(0, 6);
  }, [products]);

  const [activeProduct, setActiveProduct] = useState<ProductSummary | undefined>();
  const activeUrl = activeProduct ? productUrl(activeProduct) : "/products";

  const brandLine = brands.length > 0 ? brands.map((b) => b.name) : ["Nike", "Adidas", "Jordan", "New Balance"];

  return (
    <section className="relative overflow-hidden bg-[#111111] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(229,57,53,0.32),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.07),transparent_38%)]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-[#E53935]/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-10 md:px-5 md:pb-14 md:pt-14 lg:pb-16 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Copy */}
          <div className="animate-fade-in-up order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E53935] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E53935]" />
              </span>
              Drop mới · 2026
            </div>

            <h1 className="mt-6 text-[2.75rem] font-black leading-[0.92] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              SOLE
              <span className="text-[#E53935]">.</span>
              <span className="mt-3 block bg-gradient-to-r from-white via-white to-white/55 bg-clip-text text-2xl font-bold leading-tight text-transparent sm:text-3xl lg:text-4xl">
                Sneaker cho mọi phong cách
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 md:text-lg">
              Jordan, Dunk, Samba và hàng trăm biến thể size/màu — chọn đúng SKU, tồn kho thật, checkout an toàn.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 rounded-full bg-[#E53935] px-7 text-white shadow-[0_12px_40px_rgba(229,57,53,0.35)] hover:bg-[#d32f2f]"
              >
                <Link to="/products">
                  Khám phá ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={activeUrl}>
                  Xem {activeProduct?.name?.split(" ").slice(0, 2).join(" ") ?? "drop hot"}
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] rounded-2xl bg-white/10" />
                  ))
                : stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      <div className="text-xl font-black sm:text-2xl">{stat.value}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-white/55">{stat.label}</div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Carousel visual */}
          <div className="order-1 lg:order-2">
            {loading ? (
              <Skeleton className="mx-auto h-[360px] max-w-[440px] rounded-[2rem] bg-white/10 sm:h-[400px] lg:h-[440px]" />
            ) : (
              <HeroShoeCarousel products={carouselProducts} onActiveProductChange={setActiveProduct} />
            )}
          </div>
        </div>
      </div>

      {/* Brand marquee */}
      <div className="relative border-t border-white/10 bg-black/25 py-3">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex min-w-max animate-[marquee_28s_linear_infinite] items-center gap-10 px-6">
            {[...brandLine, ...brandLine].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.25em] text-white/35"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
